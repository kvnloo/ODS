"""Exercise the resolver's real build validation without starting Docker."""
import ast
import pathlib
import os
import re
import pytest

SCRIPT = pathlib.Path(__file__).parents[1] / 'scripts/resolve-compose-stack.sh'

def validator(tmp_path):
    source = SCRIPT.read_text(encoding='utf-8')
    start = source.index('def _extension_build_context(')
    end = source.index('def _scan_user_compose_content(', start)
    namespace = {'script_dir': tmp_path, 'pathlib': pathlib, 're': re, 'os': os}
    exec(compile(ast.parse(source[start:end]), str(SCRIPT), 'exec'), namespace)
    extension = tmp_path / 'data/user-extensions/distribution'
    extension.mkdir(parents=True)
    (extension / 'Dockerfile').write_text('FROM scratch')
    return namespace['_extension_build_context'], extension

@pytest.mark.parametrize('context', ['.', '/data/user-extensions/distribution'])
def test_container_context_projects_to_host(tmp_path, context):
    check, extension = validator(tmp_path)
    assert check(extension / 'compose.yaml', {'context': context}) == str(extension.resolve())

@pytest.mark.parametrize('build', [
    {'context': '../other'}, {'context': '/etc'},
    {'context': '.', 'dockerfile': '../../Dockerfile'},
    {'context': '.', 'network': 'host'}, {'context': '.', 'privileged': True},
    {'context': '.', 'secrets': ['host-secret']}, {'context': '${HOME}'},
    {'context': '.', 'args': ['HOST_SECRET']},
    {'context': '/data/user-extensions/distribution-evil'},
])
def test_rejects_external_or_privileged_builds(tmp_path, build):
    check, extension = validator(tmp_path)
    with pytest.raises(ValueError): check(extension / 'compose.yaml', build)

def test_rejects_symlink_escape(tmp_path):
    check, extension = validator(tmp_path)
    outside = tmp_path / 'private'; outside.write_text('secret')
    try: (extension / 'leak').symlink_to(outside)
    except OSError: pytest.skip('symlink privilege unavailable')
    with pytest.raises(ValueError): check(extension / 'compose.yaml', {'context': '.'})
