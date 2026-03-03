import { simulateBattle } from "../battle/engine.js";

export function wsRoutes(app, _opts, done) {
  app.get("/ws/battle", { websocket: true }, (socket) => {
    socket.on("message", (buf) => {
      try {
        const msg = JSON.parse(buf.toString());

        // payload: { attacker, defender OR enemy, seed, maxRounds }
        const sim = simulateBattle({
          attacker: msg.attacker,
          defender: msg.defender || null,
          enemy: msg.enemy || null,
          seed: msg.seed || null,
          maxRounds: msg.maxRounds || 200
        });

        // stream rounds
        socket.send(JSON.stringify({ type: "start", battleId: sim.battleId, start: sim.start, meta: sim.meta }));
        for (const r of sim.rounds) socket.send(JSON.stringify({ type: "round", round: r }));
        socket.send(JSON.stringify({ type: "end", end: sim.end, meta: sim.meta }));

      } catch (e) {
        socket.send(JSON.stringify({ type: "error", error: String(e?.message || e) }));
      }
    });
  });

  done();
}
