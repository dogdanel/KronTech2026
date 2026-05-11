import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export function verifyJwt(): RequestHandler {
  return (req, res, next) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: "Gateway misconfiguration" });
      return;
    }
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing bearer token" });
      return;
    }
    const token = auth.slice("Bearer ".length);
    try {
      const payload = jwt.verify(token, secret) as { sub: string };
      req.userId = payload.sub;
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };
}
