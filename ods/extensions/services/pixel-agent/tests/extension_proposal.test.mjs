import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {EventEmitter} from 'node:events';
import {createExtensionProposalTool, submitExtensionProposal} from '../plugin/extension-proposal.mjs';

const context = {agentId: 'pixel', sessionKey: 'agent:pixel:openai-user:ods-' + createHash('sha256').update('chat').digest('hex')};
const args = {chatId: 'chat', requestId: 'turn', candidate: {repository: 'https://github.com/o/r',
  commit: 'a'.repeat(40), manifest: {service: {id: 'example'}}, compose: {services: {}}}};
const receipt = {schemaVersion: 1, kind: 'ods-extension-request-proposal', chatId: 'chat', requestId: 'turn',
  state: 'pending', installationStarted: false, proposal: {draftId: 'b'.repeat(64), recipeDigest: 'c'.repeat(64), extensionId: 'example'}};

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

test('transport uses only fixed manager socket and accepts fragmented bounded frames', async () => {
  const socket = new EventEmitter();
  socket.destroy = () => {};
  socket.write = text => {
    assert.equal(JSON.parse(text).action, 'github-request-propose');
    socket.emit('data', Buffer.from('{"ok":'));
    socket.emit('data', Buffer.from('true}\n'));
  };
  const pending = submitExtensionProposal({action: 'github-request-propose'}, {connect: options => {
    assert.deepEqual(options, {path: '/run/ods-pixel-manager/extension-manager.sock'});
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
