import asyncio
import contextlib
import json
from unittest.mock import Mock

import pytest

from extension_installation import InstallationJournal, advance_installation
from extension_install_plan import build_install_plan
from routers import extensions


def make_plan(states, configured=True):
    definitions = {'app': {'id': 'app', 'depends_on': ['db']}, 'db': {'id': 'db'}}
    definitions['app']['env_vars'] = [{'key': 'APP_SECRET', 'required': True, 'secret': True}]
    return build_install_plan('app', [dict(id=k, status=v, installable=True) for k, v in states.items()],
                              definitions.__getitem__, lambda key: configured)


def test_dependencies_wait_for_readiness_and_repeated_requests_do_not_replay(tmp_path):
    path = tmp_path / 'journal.json'
    states = {'app': 'not_installed', 'db': 'not_installed'}
    calls = []

    def advance():
        return advance_installation(lambda: make_plan(states), InstallationJournal(path),
                                    lambda key: contextlib.nullcontext(), lambda *args: calls.append(args))

    first = advance()
    assert first['state'] == 'pending'
    assert first['dispatched'] is True
    assert calls == [('db', 'install')]
    # A stale catalog after acceptance and a process restart cannot replay it.
    retry = advance()
    assert retry['state'] == 'reconciliation_required'
    assert retry['dispatched'] is False
    states['db'] = 'installing'
    waiting = advance()
    assert waiting['state'] == 'pending'
    assert waiting['dispatched'] is False
    assert calls == [('db', 'install')]
    states['db'] = 'enabled'
    assert advance()['activeExtensionId'] == 'app'
    assert calls == [('db', 'install'), ('app', 'install')]
    states['app'] = 'enabled'
    assert advance()['state'] == 'succeeded'
    assert advance()['state'] == 'succeeded'
    assert len(calls) == 2
    assert InstallationJournal(path).records == {}


def test_missing_configuration_blocks_before_installing_any_dependency(tmp_path):
    dispatch = Mock()
    result = advance_installation(
        lambda: make_plan({'app': 'not_installed', 'db': 'not_installed'}, configured=False),
        InstallationJournal(tmp_path / 'journal.json'), lambda key: contextlib.nullcontext(), dispatch)
    assert result['state'] == 'configuration_required'
    dispatch.assert_not_called()


def test_shared_dependency_is_not_submitted_again_by_another_target(tmp_path):
    path = tmp_path / 'journal.json'
    graph = {'first': {'id': 'first', 'depends_on': ['db']},
             'second': {'id': 'second', 'depends_on': ['db']}, 'db': {'id': 'db'}}
    entries = [dict(id=key, status='not_installed', installable=True) for key in graph]
    dispatch = Mock()
    for target, expected in [('first', 'pending'), ('second', 'reconciliation_required')]:
        result = advance_installation(
            lambda: build_install_plan(target, entries, graph.__getitem__, lambda key: True),
            InstallationJournal(path), lambda key: contextlib.nullcontext(), dispatch)
        assert result['state'] == expected
        assert result['activeExtensionId'] == 'db'
    dispatch.assert_called_once_with('db', 'install')


def test_timeout_after_host_acceptance_is_durable_and_does_not_leak_errors(tmp_path):
    path = tmp_path / 'journal.json'
    read = lambda: make_plan({'app': 'not_installed', 'db': 'enabled'})
    dispatch = Mock(side_effect=TimeoutError('secret host detail'))
    result = advance_installation(read, InstallationJournal(path), lambda key: contextlib.nullcontext(), dispatch)
    assert result['state'] == 'reconciliation_required'
    assert 'secret host detail' not in json.dumps(result)
    retry = Mock()
    advance_installation(read, InstallationJournal(path), lambda key: contextlib.nullcontext(), retry)
    retry.assert_not_called()


def test_journal_precedes_external_effect_and_survives_process_interruption(tmp_path):
    path = tmp_path / 'journal.json'
    read = lambda: make_plan({'app': 'not_installed', 'db': 'enabled'})

    def crash(key, action):
        assert InstallationJournal(path).records[key]['state'] == 'dispatching'
        raise KeyboardInterrupt()

    with pytest.raises(KeyboardInterrupt):
        advance_installation(read, InstallationJournal(path), lambda key: contextlib.nullcontext(), crash)
    retry = Mock()
    assert advance_installation(read, InstallationJournal(path), lambda key: contextlib.nullcontext(), retry)['state'] == 'reconciliation_required'
    retry.assert_not_called()


def test_manual_lifecycle_change_while_waiting_for_lock_is_observed(tmp_path):
    states = {'app': 'not_installed', 'db': 'enabled'}

    @contextlib.contextmanager
    def lock(key):
        states[key] = 'installing'
        yield

    dispatch = Mock()
    assert advance_installation(lambda: make_plan(states), InstallationJournal(tmp_path / 'journal.json'),
                                lock, dispatch)['state'] == 'pending'
    dispatch.assert_not_called()


def test_failed_or_unhealthy_dependency_never_starts_dependent(tmp_path):
    dispatch = Mock()
    result = advance_installation(lambda: make_plan({'app': 'not_installed', 'db': 'unhealthy'}),
                                  InstallationJournal(tmp_path / 'journal.json'),
                                  lambda key: contextlib.nullcontext(), dispatch)
    assert result['state'] == 'blocked'
    dispatch.assert_not_called()


def test_journal_write_failure_prevents_dispatch(tmp_path, monkeypatch):
    journal = InstallationJournal(tmp_path / 'journal.json')
    monkeypatch.setattr(journal, 'save', Mock(side_effect=OSError('disk full')))
    dispatch = Mock()
    with pytest.raises(OSError):
        advance_installation(lambda: make_plan({'app': 'not_installed', 'db': 'enabled'}),
                             journal, lambda key: contextlib.nullcontext(), dispatch)
    dispatch.assert_not_called()


@pytest.mark.parametrize('text', ['{}', 'not json', '{"schemaVersion":1,"records":{"../escape":{}}}'])
def test_corrupt_journal_cannot_be_reset_into_a_replay(tmp_path, text):
    path = tmp_path / 'journal.json'
    path.write_text(text)
    with pytest.raises(ValueError):
        InstallationJournal(path)


def test_api_uses_existing_installer_on_worker_and_health_plan_on_api_loop(tmp_path, monkeypatch):
    monkeypatch.setattr(extensions, '_extensions_lock_path', lambda: tmp_path / 'lock')
    held = []

    @contextlib.contextmanager
    def lock(key):
        held.append(key)
        yield
        held.pop()

    monkeypatch.setattr(extensions, '_extension_operation_lock', lock)
    calls = []

    def install(key, api_key):
        assert held == [key]
        assert api_key == 'test'
        calls.append(key)

    monkeypatch.setattr(extensions, 'install_extension', Mock(__wrapped__=install))

    async def run():
        api_loop = asyncio.get_running_loop()

        async def read(key, api_key):
            assert asyncio.get_running_loop() is api_loop
            return make_plan({'app': 'not_installed', 'db': 'enabled'})

        monkeypatch.setattr(extensions, 'extension_install_plan', read)
        assert (await extensions.extension_install_next('app', api_key='test'))['state'] == 'pending'
        assert (await extensions.extension_install_next('app', api_key='test'))['state'] == 'reconciliation_required'

    asyncio.run(run())
    assert calls == ['app']


def test_enable_uses_existing_endpoint_without_implicit_dependency_mutation(tmp_path, monkeypatch):
    monkeypatch.setattr(extensions, '_extensions_lock_path', lambda: tmp_path / 'lock')
    monkeypatch.setattr(extensions, '_extension_operation_lock', lambda key: contextlib.nullcontext())
    enable = Mock()
    monkeypatch.setattr(extensions, 'enable_extension', Mock(__wrapped__=enable))

    async def read(key, api_key):
        return make_plan({'app': 'disabled', 'db': 'enabled'})

    monkeypatch.setattr(extensions, 'extension_install_plan', read)
    asyncio.run(extensions.extension_install_next('app', api_key='test'))
    enable.assert_called_once_with('app', auto_enable_deps=False, api_key='test')
