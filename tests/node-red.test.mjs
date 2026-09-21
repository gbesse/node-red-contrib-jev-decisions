// Purpose: Load the actual addon in Node-RED and exercise both output branches and native error delivery.
import test, { before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
const require = createRequire(import.meta.url), helper = require('node-red-node-test-helper'), register = require('../nodes/jev-decide.cjs');
const pack = JSON.parse(await readFile(new URL('../packs/support-triage.json', import.meta.url), 'utf8'));
const fixture = JSON.parse(await readFile(new URL('../examples/synthetic-billing-response.json', import.meta.url), 'utf8'));
let provider = async () => structuredClone(fixture);
helper.init(require.resolve('node-red'), { jevDecisionProvider: (...args) => provider(...args) });
before(async () => { await new Promise(resolve => helper.startServer(resolve)); });
afterEach(async () => { await helper.unload(); });
after(async () => { await new Promise(resolve => helper.stopServer(resolve)); });
async function load(overrides = {}) {
  await helper.load(register, [{ id: 'n', type: 'jev-decide', pack: JSON.stringify(pack), timeoutMs: 100, ...overrides, wires: [['yes'], ['review']] }, { id: 'yes', type: 'helper' }, { id: 'review', type: 'helper' }]);
  return helper.getNode('n');
}
test('actual Node-RED runtime delivers accepted decision while preserving the payload', async () => {
  provider = async () => structuredClone(fixture); const node = await load();
  const received = once(helper.getNode('yes'), 'input', { signal: AbortSignal.timeout(3000) });
  node.receive({ payload: { text: 'fixture' }, correlation: 'one' });
  const [msg] = await received; assert.equal(msg.jev.outcome, 'billing'); assert.equal(msg.correlation, 'one'); assert.deepEqual(msg.payload, { text: 'fixture' });
});
test('fallback follows review output, not the accepted output', async () => {
  provider = async () => { const r = structuredClone(fixture); r.answers.department.probabilities = { billing: .6, technical: .3, sales: .05, other: .05 }; return r; };
  const node = await load(), received = once(helper.getNode('review'), 'input', { signal: AbortSignal.timeout(3000) });
  node.receive({ payload: { text: 'fixture' } }); assert.equal((await received)[0].jev.outcome, 'review');
});
test('invalid input and provider deadlines reach Node-RED error handling', async () => {
  provider = () => new Promise(() => {}); const node = await load({ timeoutMs: 10 });
  const failure = once(node, 'call:error', { signal: AbortSignal.timeout(3000) }); node.receive({ payload: { text: 'fixture' } });
  const [call] = await failure; assert.match(String(call.args[0]), /timeout/i);
});
test('invalid configuration fails without provider invocation', async () => {
  let called = false; provider = async () => { called = true; return fixture; };
  const node = await load({ pack: 'broken' }), failure = once(node, 'call:error', { signal: AbortSignal.timeout(3000) });
  node.receive({ payload: { text: 'fixture' } }); await failure; assert.equal(called, false);
});
