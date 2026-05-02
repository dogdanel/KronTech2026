"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const middleware_js_1 = require("./middleware.js");
const authTarget = process.env.AUTH_SERVICE_URL ?? "http://127.0.0.1:3001";
const parkingTarget = process.env.PARKING_SERVICE_URL ?? "http://127.0.0.1:3002";
const bookingTarget = process.env.BOOKING_SERVICE_URL ?? "http://127.0.0.1:3003";
function userHeaderProxy(target) {
    return (0, http_proxy_middleware_1.createProxyMiddleware)({
        target,
        changeOrigin: true,
        on: {
            proxyReq: (proxyReq, req) => {
                const uid = req.userId;
                if (uid)
                    proxyReq.setHeader("x-user-id", uid);
            },
        },
    });
}
const app = (0, express_1.default)();
app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "gateway" });
});
app.use("/auth", (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: authTarget,
    changeOrigin: true,
    pathRewrite: { "^/auth": "" },
}));
const parkingPublic = userHeaderProxy(parkingTarget);
const parkingAuth = [(0, middleware_js_1.verifyJwt)(), parkingPublic];
app.get("/spaces", parkingPublic);
app.get("/spaces/:id", parkingPublic);
app.post("/spaces", ...parkingAuth);
app.patch("/spaces/:id", ...parkingAuth);
const bookingProxy = userHeaderProxy(bookingTarget);
app.use("/bookings", (0, middleware_js_1.verifyJwt)(), bookingProxy);
const port = Number(process.env.PORT ?? 3000);
app.listen(port, "0.0.0.0", () => {
    console.log(`gateway listening on ${port}`);
});
