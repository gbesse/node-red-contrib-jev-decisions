// Purpose: Check consumer typings without generating build output.
import { decide } from '../src/index.mjs';
import type { Pack } from '@gbesse/decisionpacks';
declare const pack: Pack;
const decision = await decide(pack, { text: 'fixture' });
const outcome: string = decision.outcome;
void outcome;
