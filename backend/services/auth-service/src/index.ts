import express from "express";
import authRoutes from "./routes/auth.js";
import { initDb } from "./db.js";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "auth-service" });
});

app.use("/", authRoutes);

const port = Number(process.env.PORT ?? 3001);

initDb()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`auth-service listening on ${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
