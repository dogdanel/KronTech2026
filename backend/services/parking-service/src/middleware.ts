import type { RequestHandler } from "express";

export function requireUserId(): RequestHandler {
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

export function requireInternalSecret(): RequestHandler {
  return (req, res, next) => {
    const secret = process.env.INTERNAL_SECRET;
    if (!secret) {
      res.status(500).json({ error: "Misconfigured service" });
      return;
    }
    const provided = req.headers["x-internal-secret"];
    if (provided !== secret) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
