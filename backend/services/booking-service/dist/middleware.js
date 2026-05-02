"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUserId = requireUserId;
function requireUserId() {
    return (req, res, next) => {
        const uid = req.headers["x-user-id"];
        if (typeof uid !== "string" || !uid.length) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        req.userId = uid;
        next();
    };
}
