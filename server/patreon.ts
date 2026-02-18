import type { Express } from "express";
import { authStorage } from "./replit_integrations/auth/storage";

export function registerPatreonRoutes(app: Express) {
    const patreonClientId = process.env.PATREON_CLIENT_ID;
    const patreonClientSecret = process.env.PATREON_CLIENT_SECRET;
    const appUrl = process.env.APP_URL || "http://localhost:5000";

    if (!patreonClientId || !patreonClientSecret) {
        console.log("[Patreon] No PATREON_CLIENT_ID set — Patreon linking disabled");
        return;
    }

    // Redirect user to Patreon OAuth
    app.get("/api/patreon/link", (req: any, res) => {
        if (!req.session.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const redirectUri = `${appUrl}/api/patreon/callback`;
        const scopes = "identity identity[email] identity.memberships";
        const url = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${patreonClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${req.session.userId}`;
        res.redirect(url);
    });

    // Patreon OAuth callback
    app.get("/api/patreon/callback", async (req: any, res) => {
        const { code, state: userId } = req.query;
        if (!code || !userId) {
            return res.redirect("/?error=patreon_auth_failed");
        }

        try {
            const redirectUri = `${appUrl}/api/patreon/callback`;

            // Exchange code for token
            const tokenRes = await fetch("https://www.patreon.com/api/oauth2/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    code: code as string,
                    grant_type: "authorization_code",
                    client_id: patreonClientId,
                    client_secret: patreonClientSecret,
                    redirect_uri: redirectUri,
                }),
            });

            if (!tokenRes.ok) {
                console.error("[Patreon] Token exchange failed:", await tokenRes.text());
                return res.redirect("/?error=patreon_token_failed");
            }

            const tokenData = await tokenRes.json() as any;
            const accessToken = tokenData.access_token;

            // Get user identity + memberships
            const identityRes = await fetch(
                "https://www.patreon.com/api/oauth2/v2/identity?include=memberships&fields[user]=email,full_name&fields[member]=patron_status,currently_entitled_amount_cents",
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            if (!identityRes.ok) {
                console.error("[Patreon] Identity fetch failed:", await identityRes.text());
                return res.redirect("/?error=patreon_identity_failed");
            }

            const identityData = await identityRes.json() as any;
            const patreonId = identityData.data?.id;

            // Check if they have an active patronage
            const memberships = identityData.included?.filter((i: any) => i.type === "member") || [];
            const isActivePatron = memberships.some(
                (m: any) => m.attributes?.patron_status === "active_patron"
            );

            if (isActivePatron && patreonId) {
                await authStorage.updateUserTier(userId as string, "patron", { patreonId });
                console.log(`[Patreon] User ${userId} linked as active patron`);
                res.redirect("/?patreon=linked");
            } else {
                // Link their Patreon but don't upgrade tier
                await authStorage.updateUserTier(userId as string, undefined as any, { patreonId });
                console.log(`[Patreon] User ${userId} linked but not active patron`);
                res.redirect("/?patreon=linked_not_patron");
            }
        } catch (error: any) {
            console.error("[Patreon] Error:", error.message);
            res.redirect("/?error=patreon_error");
        }
    });
}
