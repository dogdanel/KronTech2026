import express from "express";
import bookingsRoutes from "./routes/bookings.js";
import { initDb } from "./db.js";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "booking-service" });
});

app.use("/", bookingsRoutes);

const port = Number(process.env.PORT ?? 3003);

initDb()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`booking-service listening on ${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
