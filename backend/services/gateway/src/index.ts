import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { verifyJwt } from "./middleware.js";

const authTarget = process.env.AUTH_SERVICE_URL ?? "http://127.0.0.1:3001";
const parkingTarget = process.env.PARKING_SERVICE_URL ?? "http://127.0.0.1:3002";
const bookingTarget = process.env.BOOKING_SERVICE_URL ?? "http://127.0.0.1:3003";

function userHeaderProxy(target: string): ReturnType<typeof createProxyMiddleware> {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req) => {
        const uid = (req as express.Request).userId;
        if (uid) proxyReq.setHeader("x-user-id", uid);
      },
    },
  });
}

const app = express();

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "gateway" });
});

app.use(
  "/auth",
  createProxyMiddleware({
    target: authTarget,
    changeOrigin: true,
    pathRewrite: { "^/auth": "" },
  })
);

const parkingPublic = userHeaderProxy(parkingTarget);
const parkingAuth = [verifyJwt(), parkingPublic];

app.get("/spaces", parkingPublic);
app.get("/spaces/:id", parkingPublic);
app.post("/spaces", ...parkingAuth);
app.patch("/spaces/:id", ...parkingAuth);

const bookingProxy = userHeaderProxy(bookingTarget);
app.use("/bookings", verifyJwt(), bookingProxy);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, "0.0.0.0", () => {
  console.log(`gateway listening on ${port}`);
});
