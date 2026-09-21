# AI change log

This file records the purpose and technical decisions of agent-authored changes.

## 2026-09-21 — v0.1.0

- Implemented `node-red-contrib-jev-decisions` as a native host integration with a runnable example and synthetic verification.
- Reused DecisionPacks directly for JavaScript, or ported its finite gates with reference cases for PHP/Python; retained MIT attribution.
- Added bounded provider calls, pinned model checks and explicit failure handling. Host authorization remains with the integrating application.
- Documented verified scope and alpha limitations. Tests and type/syntax checks only; no production build or live inference performed.
- Validation: Node-RED 5.0.7 test-helper runtime: 4 tests. Syntax check, TypeScript noEmit and synthetic demo passed.

## 2026-09-21 — Decision Blocks v0.2.0

Added exact-policy/state review traces to both native output branches and a reusable Function flow. Validated the shipped flow in Node-RED 5.0.7 with synthetic provider responses, including preserved payload, fallback and native errors. No live calls or external effects.

## 2026-09-21 — Preserve input at the decision boundary

Snapshot the host message input before inference so a retained message mutation cannot produce an invalid review trace. A real Node-RED test mutates the original message while the provider is pending and verifies the stored input fingerprint.
