// Purpose: Register native Node-RED configuration and decision nodes with bounded concurrency and Catch errors.
module.exports = function register(RED) {
  function JevConfig(config) { RED.nodes.createNode(this, config); }
  RED.nodes.registerType('jev-config', JevConfig, { credentials: { apiKey: { type: 'password' } } });
  function JevDecide(config) {
    RED.nodes.createNode(this, config);
    const node = this, active = new Set(); let closing = false;
    const limit = Number(config.concurrency || 4), timeoutMs = Number(config.timeoutMs || 30000);
    let pack, setupError;
    try {
      pack = JSON.parse(config.pack);
      if (!Number.isInteger(limit) || limit < 1 || limit > 16 || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 300000) throw new Error('Invalid concurrency or timeout');
    } catch (error) { setupError = error; node.status({ fill: 'red', shape: 'ring', text: 'invalid configuration' }); }
    node.on('input', async (msg, send, done) => {
      send = send || node.send.bind(node); done = done || (error => { if (error) node.error(error, msg); });
      if (closing || setupError || active.size >= limit) { done(setupError || new Error(closing ? 'Node is closing' : 'Jev concurrency limit reached')); return; }
      const controller = new AbortController(); active.add(controller);
      try {
        const [{ decide }, { createJevProvider }] = await Promise.all([import('../src/index.mjs'), import('@gbesse/decisionpacks')]);
        const credentials = RED.nodes.getNode(config.connection)?.credentials;
        // Only trusted host settings may inject a provider; incoming messages cannot override credentials or transport.
        const injected = RED.settings.jevDecisionProvider;
        const provider = injected || createJevProvider({ apiKey: credentials?.apiKey, timeoutMs });
        // Freeze the input before inference; upstream nodes can retain and mutate the message while Jev is pending.
        const state = structuredClone(RED.util.getMessageProperty(msg, config.input || 'payload'));
        const decision = await decide(pack, state, { provider, timeoutMs, signal: controller.signal });
        if (closing) throw new Error('Node closed before decision delivery');
        msg.jev = decision;
        // A portable trace retains the exact policy and original state for independent Workbench review.
        msg.decisionBlock = { schemaVersion: 1, pack: structuredClone(pack), rows: [{ state: structuredClone(state), record: structuredClone(decision) }] };
        const review = decision.outcome === pack.fallback;
        node.status({ fill: review ? 'yellow' : 'green', shape: 'dot', text: decision.outcome });
        send(review ? [null, msg] : [msg, null]); done();
      } catch (error) { node.status({ fill: 'red', shape: 'ring', text: 'decision failed' }); done(error); }
      finally { active.delete(controller); }
    });
    node.on('close', (_removed, done) => { closing = true; for (const controller of active) controller.abort(new Error('Node closed')); done(); });
  }
  RED.nodes.registerType('jev-decide', JevDecide);
};
