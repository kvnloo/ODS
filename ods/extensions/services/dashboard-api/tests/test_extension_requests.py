import asyncio
import json

import pytest
from starlette.requests import Request

from extension_requests import create_request, read_request, cancel_request, bind_proposal, TTL_SECONDS


COMMAND = '/extensions https://github.com/Owner/Repo.git configure for my project'


def test_chat_context_uses_current_turn_without_modifying_saved_history():
    from routers import pixel
    history = [{'role': 'system', 'content': 'Identity'}, {'role': 'user', 'content': COMMAND}]
    body = pixel.ChatStreamRequest(chat_id='current-chat', request_id='current-turn', messages=history)
    result = pixel._edge_chat_body(body, history)
    assert len(history) == 2 and len(result['messages']) == 3
    assert result['messages'][-1] == history[-1]
    context = result['messages'][1]
    assert context['role'] == 'system'
    assert 'current-chat' in context['content'] and 'current-turn' in context['content']
    assert 'https://github.com/owner/repo' in context['content']
    assert 'does not grant execution authority' in context['content']


def test_old_extension_command_does_not_create_current_context():
    from routers import pixel
    history = [{'role': 'user', 'content': COMMAND}, {'role': 'assistant', 'content': 'Previous response'},
               {'role': 'user', 'content': 'What did we do?'}]
    body = pixel.ChatStreamRequest(chat_id='chat', request_id='next', messages=history)
    assert pixel._edge_chat_body(body, history)['messages'] == history


def test_missing_request_id_does_not_invent_an_execution_scope():
    from extension_requests import model_request_context
    assert model_request_context(COMMAND, 'chat', None) is None


def test_request_is_repo_and_turn_bound_and_never_an_installation(tmp_path):
    record = create_request(tmp_path, 'owner-secret', 'chat', 'turn', COMMAND, now=10)
    assert record['repository'] == 'https://github.com/owner/repo'
    assert record['state'] == 'pending' and record['installationStarted'] is False
    assert 'owner-secret' not in json.dumps(record)
    assert create_request(tmp_path, 'owner-secret', 'chat', 'turn', COMMAND, now=100) == record
    with pytest.raises(ValueError):
        create_request(tmp_path, 'owner-secret', 'chat', 'turn', '/extensions https://github.com/other/repo', now=100)
    with pytest.raises((ValueError, OSError)):
        read_request(tmp_path, 'other-owner', 'chat', 'turn', now=100)


def test_expired_and_cancelled_requests_cannot_be_revived(tmp_path):
    create_request(tmp_path, 'owner', 'chat', 'turn', COMMAND, now=10)
    assert create_request(tmp_path, 'owner', 'chat', 'turn', COMMAND, now=10 + TTL_SECONDS)['state'] == 'expired'
    cancel_request(tmp_path, 'owner', 'chat', 'turn', now=20)
    assert create_request(tmp_path, 'owner', 'chat', 'turn', COMMAND, now=21)['state'] == 'cancelled'


def test_cancellation_before_creation_prevents_delayed_authorization(tmp_path):
    cancelled = cancel_request(tmp_path, 'owner', 'chat', 'turn', now=10)
    assert cancelled['state'] == 'cancelled' and cancelled['repository'] is None
    assert create_request(tmp_path, 'owner', 'chat', 'turn', COMMAND, now=11) == cancelled
    assert read_request(tmp_path, 'owner', 'chat', 'turn', now=12)['state'] == 'cancelled'


def test_new_turn_cancels_only_its_owner_and_conversation(tmp_path):
    for owner, chat in [('owner', 'chat'), ('owner', 'other-chat'), ('other-owner', 'chat')]:
        create_request(tmp_path, owner, chat, 'turn', COMMAND, now=10)
    create_request(tmp_path, 'owner', 'chat', 'next', COMMAND, now=11)
    assert read_request(tmp_path, 'owner', 'chat', 'turn', now=12)['state'] == 'cancelled'
    for owner, chat in [('owner', 'other-chat'), ('other-owner', 'chat')]:
        assert read_request(tmp_path, owner, chat, 'turn', now=12)['state'] == 'pending'


@pytest.mark.parametrize('command', ['please /extensions https://github.com/o/r', '/extensions @repo',
    '/extensions http://github.com/o/r', '/extensions https://github.com.evil/o/r',
    '/extensions https://github.com/o/r?token=secret', '/extensions https://github.com/o/r/tree/main'])
def test_non_commands_and_unsafe_repository_targets_do_not_create_requests(tmp_path, command):
    with pytest.raises(ValueError):
        create_request(tmp_path, 'owner', 'chat', 'turn', command)
    assert not list(tmp_path.iterdir())


def test_api_request_lifecycle_never_calls_installation(monkeypatch, tmp_path):
    from routers import extensions
    monkeypatch.setattr(extensions, '_extensions_lock_path', lambda: tmp_path / '.lock')
    def forbidden(*args, **kwargs):
        pytest.fail('Request registration attempted installation')
    monkeypatch.setattr(extensions, '_call_agent_install', forbidden)
    def request(action):
        payload = {'action': action, 'chatId': 'chat', 'requestId': 'turn'}
        if action == 'create':
            payload['command'] = COMMAND
        async def receive():
            return {'type': 'http.request', 'body': json.dumps(payload).encode(), 'more_body': False}
        return Request({'type': 'http', 'method': 'POST', 'headers': []}, receive)
    for action, state in [('create', 'pending'), ('read', 'pending'), ('cancel', 'cancelled')]:
        result = asyncio.run(extensions.extension_github_request(request(action), api_key='owner'))
        assert result.headers['cache-control'] == 'no-store'
        assert json.loads(result.body)['state'] == state


def test_proposal_is_bound_to_repo_and_cannot_change_after_acceptance(tmp_path):
    from test_extension_recipe_validation import candidate
    from test_extension_recipe_drafts import evidence
    from extension_recipe_drafts import save_draft
    import copy
    proposal = candidate()
    create_request(tmp_path, 'owner', 'chat', 'turn', '/extensions ' + proposal['repository'], now=10)
    drafts = tmp_path / 'drafts'; drafts.mkdir()
    validation = evidence(proposal)
    draft = save_draft(drafts, 'owner', proposal, validation)
    result = bind_proposal(tmp_path, 'owner', 'chat', 'turn', proposal, validation, draft, now=11)
    assert result['proposal']['extensionId'] == 'apache-answer'
    assert result['proposal']['draftId'] == draft['draftId']
    assert bind_proposal(tmp_path, 'owner', 'chat', 'turn', proposal, validation, draft, now=12) == result
    changed = copy.deepcopy(proposal); changed['commit'] = 'b' * 40
    changed_validation = evidence(changed)
    changed_draft = save_draft(drafts, 'owner', changed, changed_validation)
    with pytest.raises(ValueError):
        bind_proposal(tmp_path, 'owner', 'chat', 'turn', changed, changed_validation, changed_draft, now=12)
    cancel_request(tmp_path, 'owner', 'chat', 'turn', now=13)
    with pytest.raises(ValueError):
        bind_proposal(tmp_path, 'owner', 'chat', 'turn', proposal, validation, draft, now=14)


def test_proposal_route_saves_only_for_active_matching_owner_request(monkeypatch, tmp_path):
    from routers import extensions
    from test_extension_recipe_validation import candidate, ODS
    from unittest.mock import AsyncMock
    proposal = candidate()
    requests = tmp_path / '.extension-requests'; requests.mkdir()
    create_request(requests, 'owner', 'chat', 'turn', '/extensions ' + proposal['repository'])
    monkeypatch.setattr(extensions, '_extensions_lock_path', lambda: tmp_path / '.lock')
    monkeypatch.setattr(extensions, 'EXTENSIONS_DIR', ODS / 'extensions/services')
    monkeypatch.setattr(extensions, 'USER_EXTENSIONS_DIR', tmp_path / 'user')
    monkeypatch.setattr(extensions, 'EXTENSIONS_LIBRARY_DIR', tmp_path / 'library')
    monkeypatch.setattr(extensions, 'extensions_catalog', AsyncMock(return_value={'extensions': []}))
    def request():
        async def receive():
            return {'type': 'http.request', 'body': json.dumps({'chatId': 'chat', 'requestId': 'turn',
                    'candidate': proposal}).encode(), 'more_body': False}
        return Request({'type': 'http', 'method': 'POST', 'headers': []}, receive)
    with pytest.raises(extensions.HTTPException) as failure:
        asyncio.run(extensions.extension_github_request_proposal(request(), api_key='other-owner'))
    assert failure.value.status_code == 409
    assert not (tmp_path / '.extension-recipe-drafts').exists()
    response = asyncio.run(extensions.extension_github_request_proposal(request(), api_key='owner'))
    result = json.loads(response.body)
    assert result['proposal']['extensionId'] == 'apache-answer'
    assert result['installationStarted'] is False
    assert response.headers['cache-control'] == 'no-store'
    assert not (tmp_path / 'library').exists() and not (tmp_path / 'user').exists()
