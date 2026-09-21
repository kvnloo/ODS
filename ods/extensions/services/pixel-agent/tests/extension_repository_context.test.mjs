import test from 'node:test';
import assert from 'node:assert/strict';
import {createExtensionRepositoryContext} from '../plugin/extension-repository-context.mjs';

test('grounds the exact requested project once, without installation or model calls', async () => {
  const calls=[];
  const context=createExtensionRepositoryContext({tool:{execute:async (...args)=>{
    calls.push(args);return {content:[{type:'text',text:'Untrusted README evidence'}]};
  }}});
  const event={prompt:'/extensions https://github.com/NandhaKishorM/laya analise antes de instalar'};
  const [a,b]=await Promise.all([context(event),context(event)]);
  assert.equal(a,b);assert.equal(calls.length,1);
  assert.equal(calls[0][1].url,'https://raw.githubusercontent.com/NandhaKishorM/laya/HEAD/README.md');
  assert.ok(calls[0][2] instanceof AbortSignal);
  assert.match(a,/not installation authorization/);
  assert.match(a,/Untrusted README evidence/);
});

test('does not fetch historical, non-command, catalog, private or ambiguous requests', async () => {
  const context=createExtensionRepositoryContext({tool:{execute:()=>{throw new Error('unexpected fetch')}}});
  for(const prompt of ['hello','/extensions @laya','/extensions http://127.0.0.1/',
    'Quoted example: /extensions https://github.com/a/b',
    '/extensions https://github.com/a/b\n[Current message - respond to this]\nUser: hello',
    '[Current message - respond to this]\nUser: /extensions https://github.com/a/b\n[Current message - respond to this]\nUser: hi']) {
    assert.equal(await context({prompt}),'');
  }
});

test('reads current wrapped requests and structured user content',async()=>{
  let count=0;
  const context=createExtensionRepositoryContext({tool:{execute:async()=>{count++;return {content:[{type:'text',text:'README'}]};}}});
  assert.match(await context({prompt:'History\n[Current message - respond to this]\nUser: /extension https://github.com/a/b'}),/README/);
  assert.match(await context({messages:[{role:'user',content:[{type:'text',text:'/extensions https://github.com/c/d'}]}]}),/README/);
  assert.equal(count,2);
});

test('failed reads remain explicit and retryable; cached evidence expires',async()=>{
  let count=0,clock=0;
  const context=createExtensionRepositoryContext({now:()=>clock,tool:{execute:async()=>{
    count++;return count===1 ? {isError:true} : {content:[{type:'text',text:'README'}]};
  }}});
  const event={prompt:'/extensions https://github.com/a/b'};
  assert.match(await context(event),/documentation read failed/);
  assert.match(await context(event),/README/);
  await context(event);assert.equal(count,2);
  clock=60001;await context(event);assert.equal(count,3);
});
