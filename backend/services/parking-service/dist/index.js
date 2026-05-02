"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const spaces_js_1 = __importDefault(require("./routes/spaces.js"));
const db_js_1 = require("./db.js");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "parking-service" });
});
app.use("/", spaces_js_1.default);
const port = Number(process.env.PORT ?? 3002);
(0, db_js_1.initDb)()
    .then(() => {
    app.listen(port, "0.0.0.0", () => {
        console.log(`parking-service listening on ${port}`);
    });
})
    .catch((err) => {
    console.error(err);
    process.exit(1);
});
