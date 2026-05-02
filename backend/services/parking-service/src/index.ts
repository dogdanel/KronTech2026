import express from "express";
import spacesRoutes from "./routes/spaces.js";
import { initDb } from "./db.js";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "parking-service" });
});

app.use("/", spacesRoutes);

const port = Number(process.env.PORT ?? 3002);

initDb()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`parking-service listening on ${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
