// Purpose: Execute a bounded DecisionPack inside a Node-RED node without performing downstream effects.
import { evaluate, createJevProvider, validatePack } from '@gbesse/decisionpacks';
import { snapshot, ensure } from './contracts.mjs';
export async function decide(pack, state, { provider, timeoutMs = 30000, signal } = {}) {
  pack = snapshot(pack); state = snapshot(state); validatePack(pack);
  ensure(JSON.stringify({ pack, state }).length <= 100000, 'Decision input exceeds 100000 characters');
  return evaluate(pack, state, { provider: provider ?? createJevProvider(), timeoutMs, signal });
}
