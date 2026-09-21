// Purpose: Type the Node-RED decision execution seam.
import type { Pack, JSONValue, Provider, DecisionRecord } from '@gbesse/decisionpacks';
export function decide(pack: Pack, state: Record<string, JSONValue>, options?: { provider?: Provider; timeoutMs?: number; signal?: AbortSignal }): Promise<DecisionRecord>;
