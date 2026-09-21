import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {EventEmitter} from 'node:events';
import {createExtensionProposalTool, createPythonLibraryProposalTool, createExtensionRequestStatusTool, createExtensionRequestPrepareTool, submitExtensionProposal} from '../plugin/extension-proposal.mjs';

const context = {agentId: 'pixel', sessionKey: 'agent:pixel:openai-user:ods-' + createHash('sha256').update('chat').digest('hex')};
const args = {chatId: 'chat', requestId: 'turn', candidate: {repository: 'https://github.com/o/r',
  commit: 'a'.repeat(40), manifest: {service: {id: 'example'}}, compose: {services: {}}}};
const receipt = {schemaVersion: 1, kind: 'ods-extension-request-proposal', chatId: 'chat', requestId: 'turn',
  state: 'pending', installationStarted: false, proposal: {draftId: 'b'.repeat(64), recipeDigest: 'c'.repeat(64), extensionId: 'example'}};

test('request status is owner-bound, read-only and never promotes missing evidence to success', async () => {
  const value={schemaVersion:1,kind:'ods-extension-request-status',chatId:'chat',requestId:'turn',
    requestState:'pending',proposalAccepted:true,prepared:false,extensionId:'example',runtimeStatus:'not_observed'};
  const calls=[];
  const tool=createExtensionRequestStatusTool(context,{submit:async payload=>{calls.push(payload);return value;}});
  assert.equal(createExtensionRequestStatusTool({...context,agentId:'other'}),null);
  assert.equal((await tool.execute('id',{chatId:'other',requestId:'turn'})).isError,true);
  assert.equal((await tool.execute('id',{chatId:'chat',requestId:'turn',action:'install'})).isError,true);
  assert.equal(calls.length,0);
  assert.deepEqual((await tool.execute('id',{chatId:'chat',requestId:'turn'})).details,value);
  assert.equal(calls[0].action,'github-request-status');
  value.runtimeStatus='enabled';
  assert.equal((await tool.execute('id',{chatId:'chat',requestId:'turn'})).isError,true);
  value.prepared=true;
  assert.equal((await tool.execute('id',{chatId:'chat',requestId:'turn'})).details.runtimeStatus,'enabled');
  value.requestId='other';
  assert.equal((await tool.execute('id',{chatId:'chat',requestId:'turn'})).isError,true);
});

test('preparation uses only the bound request and does not claim an installation', async () => {
  const value={schemaVersion:1,kind:'ods-extension-request-preparation',chatId:'chat',requestId:'turn',
    draftId:'a'.repeat(64),recipeDigest:'b'.repeat(64),extensionId:'example',state:'available',
    installationStarted:false,registered:false,runtimeVerified:false};
  const calls=[];
  const tool=createExtensionRequestPrepareTool(context,{submit:async payload=>{calls.push(payload);return value;}});
  assert.equal(createExtensionRequestPrepareTool({...context,agentId:'other'}),null);
  for (const input of [{chatId:'other',requestId:'turn'},{chatId:'chat',requestId:'turn',repository:'https://github.com/other/repo'}]) {
    assert.equal((await tool.execute('id',input)).isError,true);
  }
  assert.equal(calls.length,0);
  assert.deepEqual((await tool.execute('id',{chatId:'chat',requestId:'turn'})).details,value);
  assert.deepEqual(calls[0],{schemaVersion:1,action:'github-request-prepare',chatId:'chat',requestId:'turn'});
  for (const change of [{runtimeVerified:true},{requestId:'other'},{recipeDigest:'bad'}]) {
    const invalid=createExtensionRequestPrepareTool(context,{submit:async()=>({...value,...change})});
    assert.equal((await invalid.execute('id',{chatId:'chat',requestId:'turn'})).isError,true);
  }
});

test('only Portal sessions can submit proposals for their own conversation', async () => {
  let calls = 0;
  const tool = createExtensionProposalTool(context, {submit: async () => {calls++; return receipt;}});
  assert.equal(createExtensionProposalTool({...context, agentId: 'other'}), null);
  assert.equal(createExtensionProposalTool({...context, sessionKey: 'main'}), null);
  assert.equal((await tool.execute('id', {...args, chatId: 'other-chat'})).isError, true);
  assert.equal((await tool.execute('id', {...args, command: 'install'})).isError, true);
  assert.equal(calls, 0);
  const result = await tool.execute('id', args);
  assert.equal(result.isError, undefined);
  assert.equal(JSON.parse(result.content[0].text).state, 'draft');
  assert.equal(calls, 1);
});

test('flat Python library proposals keep identical owner binding and immutable source checks', async () => {
  let submitted;
  const tool = createPythonLibraryProposalTool(context, {submit:async value => {submitted=value; return receipt;}});
  const input = {chatId:'chat',requestId:'turn',repository:'https://github.com/o/r',commit:'a'.repeat(40),
    serviceId:'example',name:'Example',pythonVersion:'3.12',pythonImports:['actual_package']};
  assert.equal(createPythonLibraryProposalTool({...context,agentId:'other'}),null);
  assert.equal((await tool.execute('one',{...input,command:['invented']})).isError,true);
  assert.equal((await tool.execute('one',{...input,chatId:'other'})).isError,true);
  assert.equal(submitted,undefined);
  assert.equal((await tool.execute('one',input)).isError,undefined);
  assert.equal(submitted.action,'github-request-propose');
  assert.equal(submitted.candidate.compose.services.example.build.context,'https://github.com/o/r.git#'+'a'.repeat(40));
  assert.equal(submitted.candidate.manifest.service.startup_check,false);
  assert.match(submitted.candidate.compose.services.example.command[2], /importlib.import_module/);
  assert.equal(tool.parameters.properties.command,undefined);
  assert.equal(tool.parameters.properties.source,undefined);
});

test('rejects large proposals and ambiguous or changed receipts without echoing errors', async () => {
  const large = {...args, candidate: {...args.candidate, compose: {data: 'x'.repeat(32768)}}};
  const unavailable = createExtensionProposalTool(context, {submit: async () => {throw Error('private-token');}});
  assert.equal((await unavailable.execute('id', large)).isError, true);
  assert.ok(!JSON.stringify(await unavailable.execute('id', args)).includes('private-token'));
  for (const change of [{requestId: 'other'}, {installationStarted: true}, {state: 'cancelled'}, {proposal: {}}]) {
    const tool = createExtensionProposalTool(context, {submit: async () => ({...receipt, ...change})});
    assert.equal((await tool.execute('id', args)).isError, true);
  }
});

test('wrong tool arguments return the actual schema without echoing submitted questions', async () => {
  let submitted = false;
  const tool = createExtensionProposalTool(context, {submit: async () => {submitted = true;}});
  const result = await tool.execute('id', {questions:[{question:'private-user-text'}]});
  const detail = JSON.parse(result.content[0].text);
  assert.equal(result.isError, true);
  assert.equal(detail.proposalSubmitted, false);
  assert.deepEqual(detail.parameters.required, ['chatId','requestId','source']);
  assert.deepEqual(detail.parameters.properties.source, tool.parameters.properties.source.description
    ? Object.fromEntries(Object.entries(tool.parameters.properties.source).filter(([key]) => key !== 'description'))
    : tool.parameters.properties.source);
  assert.equal(submitted, false);
  assert.ok(!result.content[0].text.includes('private-user-text'));
});

test('transport uses only fixed manager socket and accepts fragmented bounded frames', async () => {
  const socket = new EventEmitter();
  socket.destroy = () => {};
  socket.write = text => {
    assert.equal(JSON.parse(text).action, 'github-request-propose');
    socket.emit('data', Buffer.from('{"ok":'));
    socket.emit('data', Buffer.from('true}\n'));
  };
  const pending = submitExtensionProposal({action: 'github-request-propose'}, {connect: options => {
    assert.deepEqual(options, {path: process.platform === 'darwin' ? '/private/var/lib/ods-pixel-manager/extension-manager.sock' : '/run/ods-pixel-manager/extension-manager.sock'});
    return socket;
  }});
  socket.emit('connect');
  assert.deepEqual(await pending, {ok: true});
});

test('transport rejects oversized response rather than returning arbitrary manager output', async () => {
  const socket = new EventEmitter();
  socket.destroy = () => {};
  socket.write = () => socket.emit('data', Buffer.alloc(16385, 65));
  const pending = submitExtensionProposal({}, {connect: () => socket});
  socket.emit('connect');
  await assert.rejects(pending, /unavailable/);
});

test('surfaces only bounded value-free diagnostics for this exact request', async () => {
  const diagnostic = {...receipt, state: 'invalid-recipe', errors: [
    {code: 'manifest-schema', path: 'manifest/required'},
    {code: 'healthcheck-required', path: 'compose/services/healthcheck'},
  ]};
  const run = result => createExtensionProposalTool(context, {submit: async () => result}).execute('id', args);
  const valid = await run(diagnostic);
  assert.equal(valid.isError, true);
  assert.match(valid.content[0].text, /healthcheck-required/);
  for (const changed of [{chatId: 'other'}, {installationStarted: true},
    {errors: [{code: 'manifest-schema', path: 'manifest', value: 'private-token'}]}]) {
    const result = await run({...diagnostic, ...changed});
    assert.doesNotMatch(result.content[0].text, /private-token|healthcheck-required/);
  }
});

test('simple source proposals use the same scoped API and immutable recipe validation', async () => {
  let submitted;
  const tool = createExtensionProposalTool(context, {submit: async payload => { submitted = payload; return receipt; }});
  const source = {repository: args.candidate.repository, commit: args.candidate.commit,
    serviceId: 'example', name: 'Example', dockerfile: 'Dockerfile', port: 8080, healthPath: '/health',
    healthcheck: ['CMD', 'curl', '-f', 'http://localhost:8080/health']};
  assert.equal((await tool.execute('id', {chatId: 'chat', requestId: 'turn', source})).isError, undefined);
  assert.equal(submitted.action, 'github-request-propose');
  assert.equal(submitted.candidate.manifest.service.id, 'example');
  assert.equal(submitted.candidate.compose.services.example.pull_policy, 'never');
  assert.equal((await tool.execute('id', {...args, source})).isError, true);
});

for (const [platform, path] of [['darwin', '/private/var/lib/ods-pixel-manager/extension-manager.sock'], ['linux', '/run/ods-pixel-manager/extension-manager.sock']]) {
  test(`proposal reaches the native manager on ${platform}`, async () => {
    const socket = new EventEmitter();
    socket.destroy = () => {};
    socket.write = () => socket.emit('data', Buffer.from('{"ok":true}\n'));
    const pending = submitExtensionProposal({}, {platform, connect: options => {
      assert.deepEqual(options, {path});
      return socket;
    }});
    socket.emit('connect');
    assert.deepEqual(await pending, {ok: true});
  });
}
