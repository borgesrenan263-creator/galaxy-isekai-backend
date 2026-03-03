export async function battleRoutes(app) {
  // =========================
  // POST /battle/simulate
  // =========================
  app.post("/battle/simulate", async (req, reply) => {
    return {
      ok: true,
      message: "battle module OK",
    };
  });

  // =========================
  // GET /battle/replay/:id
  // =========================
  app.get("/battle/replay/:id", async (req, reply) => {
    return {
      ok: true,
      replay: {},
    };
  });
}
