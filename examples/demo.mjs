// Purpose: Exercise the actual decision seam with a labeled synthetic response.
import { readFile } from 'node:fs/promises';
import { decide } from '../src/index.mjs';
const read = async name => JSON.parse(await readFile(new URL(name, import.meta.url), 'utf8'));
const result = await decide(await read('../packs/support-triage.json'), await read('./billing-state.json'), { provider: async () => read('./synthetic-billing-response.json') });
console.log(JSON.stringify({ syntheticFixture: true, decision: result }, null, 2));
