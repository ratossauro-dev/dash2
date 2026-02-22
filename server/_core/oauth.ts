import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

export function registerOAuthRoutes(app: Express) {
  // Login locally with password
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { password } = req.body;

    if (!password || password !== ENV.dashboardPassword) {
      console.warn(`[Auth] Login attempt failed. Received password length: ${password?.length || 0}`);
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    try {
      // Use the ownerOpenId for the local admin session
      const sessionToken = await sdk.createSessionToken(ENV.ownerOpenId, {
        name: "Admin",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Keep callback route as a stub to avoid 404s if someone hits it
  app.get("/api/oauth/callback", (req: Request, res: Response) => {
    res.redirect(302, "/");
  });
}
