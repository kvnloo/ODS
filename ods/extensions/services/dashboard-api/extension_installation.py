"""Resume catalog installation without replaying an uncertain host request.

The caller holds the shared installation lock, and supplies the existing
per-service lifecycle lock and trusted installer. No shell or secrets enter
this coordinator. One request advances at most one service.
"""
import json
import os
import tempfile
from pathlib import Path

from extension_install_plan import ID


class InstallationJournal:
    def __init__(self, path):
        self.path = Path(path)
        if self.path.is_symlink():
            raise ValueError('Installation journal is a symlink')
        self.records = {}
        if self.path.exists():
            if self.path.stat().st_size > 1024 * 1024:
                raise ValueError('Installation journal is oversized')
            value = json.loads(self.path.read_text(encoding='utf-8'))
            if (not isinstance(value, dict) or set(value) != {'schemaVersion', 'records'}
                    or value['schemaVersion'] != 1 or not isinstance(value['records'], dict)):
                raise ValueError('Invalid installation journal')
            for key, record in value['records'].items():
                if (not ID.fullmatch(key) or not isinstance(record, dict)
                        or set(record) != {'action', 'state'}
                        or record['action'] not in ('install', 'enable')
                        or record['state'] not in ('dispatching', 'accepted', 'uncertain')):
                    raise ValueError('Invalid installation journal record')
            self.records = value['records']

    def save(self):
        if self.path.is_symlink():
            raise ValueError('Installation journal is a symlink')
        fd, temporary = tempfile.mkstemp(prefix='.install-', dir=self.path.parent)
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as stream:
                json.dump({'schemaVersion': 1, 'records': self.records}, stream)
                stream.flush()
                os.fsync(stream.fileno())
            os.replace(temporary, self.path)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)


def advance_installation(read_plan, journal, operation_lock, dispatch):
    """Recheck after acquiring the lifecycle lock; retain ambiguous effects."""
    def choose(plan):
        # A healthy observation reconciles a prior request. Never equate the
        # install endpoint's HTTP acceptance with application readiness.
        reconciled = [s['extensionId'] for s in plan['steps']
                      if s['action'] == 'none' and s['extensionId'] in journal.records]
        for key in reconciled:
            del journal.records[key]
        if reconciled:
            journal.save()
        if plan['blocked']:
            return 'blocked', None
        if plan['requiresConfiguration']:
            return 'configuration_required', None
        for step in plan['steps']:
            if step['action'] == 'none':
                continue
            if step['action'] == 'wait':
                return 'pending', step
            if step['extensionId'] in journal.records:
                # Includes a crash between sending to the host and saving the
                # reply. Do not turn a missing/stale status into another POST.
                return 'reconciliation_required', step
            return 'ready', step
        return 'succeeded', None

    def result(state, plan, step=None, dispatched=False):
        return {'schemaVersion': 1, 'extensionId': plan['extensionId'],
                'state': state, 'activeExtensionId': step['extensionId'] if step else None,
                'dispatched': dispatched, 'plan': plan}

    plan = read_plan()
    state, step = choose(plan)
    if state != 'ready':
        return result(state, plan, step)
    selected = step['extensionId']
    with operation_lock(selected):
        # The Extensions page can have changed the same service while this
        # request waited. All mutations use the same per-service lock.
        plan = read_plan()
        state, step = choose(plan)
        if state != 'ready':
            return result(state, plan, step)
        if step['extensionId'] != selected:
            return result('pending', plan, step)
        journal.records[selected] = {'action': step['action'], 'state': 'dispatching'}
        journal.save()  # Must succeed before causing an external effect.
        try:
            dispatch(selected, step['action'])
        except Exception:
            # Do not expose host errors, configuration values, or raw logs.
            journal.records[selected]['state'] = 'uncertain'
            journal.save()
            return result('reconciliation_required', plan, step, dispatched=True)
        journal.records[selected]['state'] = 'accepted'
        journal.save()
        return result('pending', plan, step, dispatched=True)
