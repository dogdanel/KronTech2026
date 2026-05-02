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
