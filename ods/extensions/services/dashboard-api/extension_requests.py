"""Owner-submitted GitHub extension requests, scoped to a single chat turn.

These records are prerequisites for future execution, not Operations grants.
Callers serialize mutations with the extension lock.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
import time

from extension_github import repository_identity


TTL_SECONDS = 6 * 60 * 60


def command_repository(command):
    if not isinstance(command, str) or len(command) > 16384:
        raise ValueError('Invalid extension command')
    match = re.match(r'^(?:/goal\s+)?/extensions?\s+(https://github\.com/[^\s]+)(?:\s|$)', command.strip(), re.IGNORECASE)
    if not match:
        raise ValueError('An explicit GitHub extension command is required')
    return 'https://github.com/' + repository_identity(match.group(1)).lower()


def model_request_context(command, chat_id, request_id):
    """Routing facts only. The request store, never this text, controls execution."""
    try:
        _identity('context-validation', chat_id, request_id)
        repository = command_repository(command)
    except ValueError:
        return None
    return {'role': 'system', 'content': (
        'Current GitHub extension request routing context: ' + json.dumps({
            'chatId': chat_id, 'requestId': request_id, 'repository': repository,
        }, sort_keys=True) + '. Use these exact identifiers when a request-scoped extension '
        'proposal tool is available. Research the requested repository and submit its actual '
        'installation recipe when the owner asks to proceed; preserve their requirements. '
        'For research-only requests, explain the findings before proposing installation. '
        'For a standard Python library use pixel_ods_python_library_proposal with its eight flat fields. For other services use pixel_ods_extension_proposal with chatId, requestId and source. '
        'ODS constructs manifest/Compose from the researched Dockerfile and runtime checks. '
        'Use the selected tool schema; describe it if its fields are not already available. '
        'Installing packages in the agent sandbox does not register an ODS extension. '
        'A follow-up message can continue this request, but unrelated chat is not permission '
        'to advance it. Use pixel_ods_extension_request_status with these original chatId/requestId '
        'to observe a saved proposal and its managed runtime; this read does not install anything. This context does not grant '
        'execution authority: the backend must confirm an active owner request and matching '
        'validated recipe before proceeding. A saved or available recipe is not an installed application.'
    )}


def _identity(owner, chat_id, request_id):
    if not isinstance(owner, str) or not owner:
        raise ValueError('Missing owner')
    for value in (chat_id, request_id):
        if not isinstance(value, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,128}', value):
            raise ValueError('Invalid chat request identity')
    owner_digest = hashlib.sha256(owner.encode()).hexdigest()
    identifier = hashlib.sha256(json.dumps([owner_digest, chat_id, request_id], separators=(',', ':')).encode()).hexdigest()
    return owner_digest, identifier


def _directory(directory):
    directory = Path(directory)
    if directory.is_symlink() or not directory.is_dir():
        raise ValueError('Invalid extension request storage')
    return directory


def _read(path):
    if path.is_symlink() or not path.is_file() or path.stat().st_size > 16384:
        raise ValueError('Invalid extension request file')
    value = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(value, dict):
        raise ValueError('Invalid extension request record')
    return value


def _write(path, record):
    if path.is_symlink():
        raise ValueError('Invalid extension request file')
    descriptor, temporary = tempfile.mkstemp(prefix='.request-', dir=path.parent)
    try:
        with os.fdopen(descriptor, 'w', encoding='utf-8') as stream:
            json.dump(record, stream, sort_keys=True)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def read_request(directory, owner, chat_id, request_id, *, now=None):
    owner_digest, identifier = _identity(owner, chat_id, request_id)
    record = _read(_directory(directory) / (identifier + '.json'))
    required = {'schemaVersion', 'ownerDigest', 'chatId', 'requestId', 'repository', 'createdAt', 'expiresAt', 'state'}
    if (set(record) not in (required, required | {'proposal'})
            or record['schemaVersion'] != 1 or record['ownerDigest'] != owner_digest
            or record['chatId'] != chat_id or record['requestId'] != request_id
            or record['state'] not in {'pending', 'cancelled'}
            or type(record['createdAt']) is not int or type(record['expiresAt']) is not int
            or record['expiresAt'] != record['createdAt'] + TTL_SECONDS):
        raise ValueError('Extension request identity changed')
    tombstone = record['state'] == 'cancelled' and record['repository'] is None
    if not tombstone and record['repository'] != 'https://github.com/' + repository_identity(record['repository']).lower():
        raise ValueError('Invalid request repository')
    current = int(time.time()) if now is None else now
    state = record['state'] if record['state'] == 'cancelled' or current < record['expiresAt'] else 'expired'
    proposal = record.get('proposal')
    if proposal is not None and (not isinstance(proposal, dict)
            or set(proposal) != {'draftId', 'recipeDigest', 'extensionId'}
            or any(not isinstance(proposal[key], str) or not re.fullmatch('[a-f0-9]{64}', proposal[key])
                   for key in ('draftId', 'recipeDigest'))
            or not isinstance(proposal['extensionId'], str) or not re.fullmatch('[a-z0-9][a-z0-9_-]{0,63}', proposal['extensionId'])):
        raise ValueError('Invalid bound proposal')
    return {'schemaVersion': 1, 'id': identifier, 'chatId': chat_id, 'requestId': request_id,
            'repository': record['repository'], 'state': state, 'expiresAt': record['expiresAt'],
            'installationStarted': False, **({'proposal': proposal} if proposal is not None else {})}


def active_chat_request(directory, owner, chat_id, *, now=None):
    """Recover only the authenticated owner's one still-live request."""
    owner_digest, _ = _identity(owner, chat_id, 'lookup')
    current = None
    for path in _directory(directory).glob('*.json'):
        record = _read(path)
        if record.get('ownerDigest') != owner_digest or record.get('chatId') != chat_id:
            continue
        receipt = read_request(directory, owner, chat_id, record.get('requestId'), now=now)
        if receipt['state'] != 'pending':
            continue
        if current is not None:
            raise ValueError('Ambiguous active extension request')
        current = receipt
    return current


def bind_proposal(directory, owner, chat_id, request_id, candidate, validation, draft, *, now=None):
    """Bind one exact validated proposal; the caller holds the request lock."""
    current = read_request(directory, owner, chat_id, request_id, now=now)
    digest = hashlib.sha256(json.dumps(candidate, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()).hexdigest()
    repository = 'https://github.com/' + repository_identity(candidate.get('repository')).lower()
    if (current['state'] != 'pending' or repository != current['repository']
            or validation.get('valid') is not True or validation.get('recipeDigest') != digest
            or validation.get('errors') != [] or validation.get('existingExtensionIds') != []
            or draft.get('recipeDigest') != digest or draft.get('state') != 'draft'
            or draft.get('installationStarted') is not False or draft.get('registered') is not False):
        raise ValueError('Proposal does not match active owner request')
    proposal = {'draftId': draft['draftId'], 'recipeDigest': digest,
                'extensionId': candidate['manifest']['service']['id']}
    if current.get('proposal') is not None:
        if current['proposal'] != proposal:
            raise ValueError('Request already has another proposal')
        return current
    if not isinstance(proposal['draftId'], str) or not re.fullmatch('[a-f0-9]{64}', proposal['draftId']):
        raise ValueError('Invalid proposal draft')
    if not isinstance(proposal['extensionId'], str) or not re.fullmatch('[a-z0-9][a-z0-9_-]{0,63}', proposal['extensionId']):
        raise ValueError('Invalid proposal extension')
    path = _directory(directory) / (current['id'] + '.json')
    record = _read(path)
    record['proposal'] = proposal
    _write(path, record)
    return read_request(directory, owner, chat_id, request_id, now=now)


def create_request(directory, owner, chat_id, request_id, command, *, now=None):
    repository = command_repository(command)
    owner_digest, identifier = _identity(owner, chat_id, request_id)
    directory = _directory(directory)
    path = directory / (identifier + '.json')
    if path.exists() or path.is_symlink():
        existing = read_request(directory, owner, chat_id, request_id, now=now)
        if existing['repository'] != repository and existing['repository'] is not None:
            raise ValueError('Request cannot change repositories')
        return existing  # Never revive an expired or cancelled turn.
    # Only one live request per owner/chat. A later explicit turn replaces its
    # pending predecessor, but never affects another owner's conversation.
    for peer in directory.glob('*.json'):
        record = _read(peer)
        if record.get('ownerDigest') == owner_digest and record.get('chatId') == chat_id and record.get('state') == 'pending':
            record['state'] = 'cancelled'
            _write(peer, record)
    current = int(time.time()) if now is None else now
    _write(path, {'schemaVersion': 1, 'ownerDigest': owner_digest, 'chatId': chat_id,
                  'requestId': request_id, 'repository': repository, 'state': 'pending',
                  'createdAt': current, 'expiresAt': current + TTL_SECONDS})
    return read_request(directory, owner, chat_id, request_id, now=current)


def cancel_request(directory, owner, chat_id, request_id, *, now=None):
    owner_digest, identifier = _identity(owner, chat_id, request_id)
    path = _directory(directory) / (identifier + '.json')
    if not path.exists() and not path.is_symlink():
        # Cancellation can arrive before the original POST. Retain a terminal
        # tombstone so a delayed creation can never revive this chat turn.
        current = int(time.time()) if now is None else now
        _write(path, {'schemaVersion': 1, 'ownerDigest': owner_digest, 'chatId': chat_id,
                      'requestId': request_id, 'repository': None, 'state': 'cancelled',
                      'createdAt': current, 'expiresAt': current + TTL_SECONDS})
        return read_request(directory, owner, chat_id, request_id, now=current)
    current = read_request(directory, owner, chat_id, request_id, now=now)
    path = Path(directory) / (current['id'] + '.json')
    record = _read(path)
    record['state'] = 'cancelled'
    _write(path, record)
    return read_request(directory, owner, chat_id, request_id, now=now)
