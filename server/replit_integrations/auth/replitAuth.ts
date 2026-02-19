import session from "express-session";
// @ts-ignore - passport is CJS
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express, RequestHandler } from "express";
import createMemoryStore from "memorystore";
import { authStorage } from "./storage";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

// Admin user IDs or emails — set in Render env vars
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "").split(",").filter(Boolean);
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await authStorage.getUser(id);
    done(null, user || null);
  } catch (err) {
    done(err, null);
  }
});

export function getSession() {
  const MemoryStore = createMemoryStore(session);
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  return session({
    secret: process.env.SESSION_SECRET || "eldgrove-dev-secret-change-in-production",
    store: new MemoryStore({ checkPeriod: sessionTtl }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.use(getSession());

  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback";

  if (clientID && clientSecret) {
    // === PRODUCTION: Google OAuth ===
    const appUrl = process.env.APP_URL || "";
    const resolvedCallbackURL = callbackURL?.startsWith("http")
      ? callbackURL
      : `${appUrl}/api/auth/google/callback`;

    console.log("[Auth] Google OAuth config:", {
      clientID: clientID.substring(0, 10) + "...",
      callbackURL: resolvedCallbackURL,
    });

    passport.use(
      new GoogleStrategy(
        {
          clientID,
          clientSecret,
          callbackURL: resolvedCallbackURL,
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
          try {
            const email = profile.emails?.[0]?.value;
            const user = await authStorage.upsertUser({
              id: profile.id,
              email: email || null,
              firstName: profile.name?.givenName || null,
              lastName: profile.name?.familyName || null,
              profileImageUrl: profile.photos?.[0]?.value || null,
            });
            // Auto-upgrade admin emails
            if (email && ADMIN_EMAILS.includes(email.toLowerCase()) && user.accessTier !== "admin") {
              const upgraded = await authStorage.updateUserTier(user.id, "admin");
              console.log(`[Auth] Auto-upgraded ${email} to admin tier`);
              return done(null, upgraded);
            }
            done(null, user);
          } catch (err) {
            done(err as Error, undefined);
          }
        }
      )
    );

    app.use(passport.initialize());
    app.use(passport.session());

    // Google sign-in entry point
    app.get(
      "/api/login",
      passport.authenticate("google", {
        scope: ["profile", "email"],
        accessType: "offline",
        prompt: "consent",
      })
    );

    // Google callback
    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/?error=auth_failed" }),
      (req: any, res) => {
        req.session.userId = req.user.id;
        console.log(`[Auth] User logged in: id=${req.user.id} email=${req.user.email}`);
        req.session.save(() => {
          res.redirect("/");
        });
      }
    );
  } else {
    // === LOCAL DEV: Auto-login bypass ===
    console.log("[Auth] No GOOGLE_CLIENT_ID set — using local dev auth bypass");
    const DEV_USER = {
      id: "local-dev-user",
      email: "dev@eldgrove.local",
      firstName: "Adventurer",
      lastName: "Dev",
      profileImageUrl: null,
      accessTier: "admin" as const, // dev user gets admin access
    };
    await authStorage.upsertUser(DEV_USER);

    app.get("/api/login", async (req, res) => {
      req.session.userId = DEV_USER.id;
      req.session.save(() => {
        res.redirect("/");
      });
    });

    app.get("/api/auth/google/callback", (_req, res) => {
      res.redirect("/");
    });
  }

  // Logout route
  app.get("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
}

// Middleware: user must be logged in
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Middleware: user must have paid access (player, gm, beta, or admin)
export const hasPaidAccess: RequestHandler = async (req: any, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Admin IDs or emails always have access
  if (ADMIN_USER_IDS.includes(req.session.userId)) {
    return next();
  }
  const user = await authStorage.getUser(req.session.userId);
  if (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return next();
  }
  if (!user || user.accessTier === "free") {
    return res.status(403).json({ message: "Access required. Please purchase access or redeem an access key." });
  }
  next();
};

// Middleware: user must be admin
export const isAdmin: RequestHandler = async (req: any, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await authStorage.getUser(req.session.userId);
  if (!user || (user.accessTier !== "admin" && !ADMIN_USER_IDS.includes(user.id))) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
