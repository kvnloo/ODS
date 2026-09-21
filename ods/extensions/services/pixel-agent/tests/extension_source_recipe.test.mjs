import test from 'node:test';
import assert from 'node:assert/strict';
import {compileSourceRecipe} from '../plugin/extension-source-recipe.mjs';

const source = {repository: 'https://github.com/example/project', commit: 'a'.repeat(40),
  serviceId: 'example-project', name: 'Example Project', dockerfile: 'deploy/Dockerfile',
  port: 8080, healthPath: '/health', healthcheck: ['CMD', 'curl', '-f', 'http://localhost:8080/health']};

test('compiles only packaging conventions and preserves the researched application', () => {
  const recipe = compileSourceRecipe(source);
  assert.equal(recipe.manifest.service.port, 8080);
  assert.equal(recipe.manifest.service.external_port_env, 'EXAMPLE_PROJECT_PORT');
  const service = recipe.compose.services['example-project'];
  assert.deepEqual(service.build, {context: source.repository + '.git#' + source.commit, dockerfile: 'deploy/Dockerfile'});
  assert.equal(service.image, 'ods-source-example-project:' + source.commit);
  assert.equal(service.container_name, 'ods-example-project');
  assert.deepEqual(service.ports, ['127.0.0.1:${EXAMPLE_PROJECT_PORT:-8080}:8080']);
  assert.deepEqual(service.healthcheck.test, source.healthcheck);
  assert.equal(service.command, undefined);
});

test('inline shell variables remain in the container, not host interpolation', () => {
  const {dockerfile, ...inline} = source;
  const recipe = compileSourceRecipe({...inline, dockerfileInline: 'FROM python:3.12-slim\nCOPY . /app\nRUN echo "$HOME"\n',
    command: ['sh', '-c', 'exec app "$PORT"']});
  const service = recipe.compose.services['example-project'];
  assert.match(service.build.dockerfile_inline, /"\$\$HOME"/);
  assert.equal(service.command[2], 'exec app "$$PORT"');
});

test('a registry package alone is not the requested immutable source', () => {
  const {dockerfile, ...inline} = source;
  assert.throws(() => compileSourceRecipe({...inline,
    dockerfileInline: 'FROM python:3.12-slim\nRUN pip install unrelated\n'}), /checked-out repository source/);
});

test('CLI verification does not invent a server, port or background process', () => {
  const {healthPath, healthcheck, ...cli} = source;
  const recipe = compileSourceRecipe({...cli, port: 0, cliOnly: true,
    command: ['python', '-m', 'upstream_cli', '--version']});
  assert.equal(recipe.manifest.service.startup_check, false);
  assert.equal(recipe.manifest.service.external_link, false);
  assert.equal(recipe.compose.services['example-project'].ports, undefined);
  assert.equal(recipe.compose.services['example-project'].restart, undefined);
  assert.equal(recipe.compose.services['example-project'].healthcheck, undefined);
  assert.equal(recipe.manifest.service.health, '');
  assert.throws(() => compileSourceRecipe({...source, port: 0, healthPath: '', cliOnly: true}));
});

test('invalid identities, ambiguous Dockerfiles and unsupported host fields are rejected', () => {
  for (const change of [{commit: 'main'}, {repository: 'http://localhost/repo'}, {serviceId: '../host'},
    {dockerfileInline: 'FROM alpine'}, {dockerfile: ''}, {port: '8080'}, {healthPath: ''},
    {cliOnly: true}, {privileged: true}, {constructor: 'bad'}, {healthcheck: ['NONE']}]) {
    assert.throws(() => compileSourceRecipe({...source, ...change}));
  }
});
