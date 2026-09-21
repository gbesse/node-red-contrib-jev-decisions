# Jev decisions for Node-RED

A native Node-RED node that turns a versioned DecisionPack into two flow outputs: an accepted decision or review. Uses the existing [DecisionPacks runtime](https://github.com/gbesse/decisionpacks).

**v0.1.0 experimental alpha · MIT · Node.js 22+**. Tested with Node-RED 5.0.7. Independent community integration, not an official Typesafe product.

## Install and try

In your Node-RED user directory (usually `~/.node-red`):

```sh
npm install github:gbesse/node-red-contrib-jev-decisions#v0.1.0
```

Restart Node-RED. Import `examples/support-triage-flow.json`. Open **Jev decide**, configure the **Jev connection** with your Typesafe key, and deploy. Click the example Inject node. It supplies `msg.payload = {"text":"I was charged twice"}`. The pack is already embedded in the example flow.

Output 1 carries accepted outcomes. Output 2 carries the pack's fallback (`review`). Both preserve the incoming payload and add a full decision record to `msg.jev`. Route categories with a Switch on `msg.jev.outcome`. Provider failures go to a native Catch node and never become a successful fallback.

API keys use Node-RED credentials. Set `credentialSecret` in your host configuration. Only administrators should edit the pack. Requests are limited to 30 seconds by default and four concurrent evaluations per node; excess inputs report an error rather than accumulate indefinitely. Closing a node cancels its active requests. Trusted hosts may inject `settings.jevDecisionProvider` for testing; messages cannot replace the provider.

## Offline verification

```sh
npm ci
npm run check
npm run typecheck
npm test
npm run demo
```

Four tests execute the actual Node-RED test-helper runtime with synthetic judgments: accepted routing, review routing, error/timeout propagation and bad configuration. No real Jev inference or visual editor interaction was tested. The demo is explicitly synthetic.

See [reuse and provenance](docs/reuse.md), [contributing](CONTRIBUTING.md) and [security](SECURITY.md).

[Recorded verification scope](docs/verification.md).

## Decision Blocks

Import `examples/decision-blocks-flow.json` into Node-RED 5.0.7. Configure the Jev connection, connect your state source to the decision node, and wire output 2 to a human review queue. The example's `trace-output` and `review-output` are test sinks: replace them with File/Debug or your queue nodes in the editor. No action or email is executed by this example.

Every successful message now includes `msg.decisionBlock = {schemaVersion:1, pack, rows:[{state,record}]}`. Save the serialized trace from output 1 as JSON and import it in Decision Workbench → Decision Review. Both outputs retain the trace, including fallback results. The embedded pack pins policy content/version; credentials never belong in a pack or a trace. Traces contain input data: keep them private unless intentionally shared.

The package remains a native Node-RED addon; Decision Blocks is the reusable flow and review interchange, not another provider. Tests load the actual node and the shipped Function flow in Node-RED.
