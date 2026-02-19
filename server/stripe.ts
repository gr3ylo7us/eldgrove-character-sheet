import Stripe from "stripe";
import type { Express, Request, Response } from "express";
import { authStorage } from "./replit_integrations/auth/storage";

let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

export function registerStripeRoutes(app: Express) {
    if (!stripe) {
        console.log("[Stripe] No STRIPE_SECRET_KEY set — payment routes disabled");
        return;
    }

    const priceAmount = 500; // $5.00 in cents
    const appUrl = process.env.APP_URL || "http://localhost:5000";

    // Create a checkout session for $5 one-time payment
    app.post("/api/checkout", async (req: any, res: Response) => {
        if (!req.session.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await authStorage.getUser(req.session.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.accessTier !== "free") {
            return res.status(400).json({ message: "You already have access!" });
        }

        try {
            const session = await stripe!.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: "Eldgrove Character Sheet — Full Access",
                                description: "One-time payment for complete access to the Eldgrove Character Sheet tool.",
                            },
                            unit_amount: priceAmount,
                        },
                        quantity: 1,
                    },
                ],
                mode: "payment",
                success_url: `${appUrl}/?payment=success`,
                cancel_url: `${appUrl}/?payment=cancelled`,
                client_reference_id: user.id,
                customer_email: user.email || undefined,
            });

            res.json({ url: session.url });
        } catch (error: any) {
            console.error("[Stripe] Checkout error:", error.message);
            res.status(500).json({ message: "Failed to create checkout session" });
        }
    });

    // Stripe webhook handler
    app.post(
        "/api/webhooks/stripe",
        // Note: Stripe webhooks need raw body. Express JSON middleware must be
        // skipped for this route — handled in routes.ts registration order.
        async (req: Request, res: Response) => {
            const sig = req.headers["stripe-signature"];
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

            if (!sig || !webhookSecret) {
                return res.status(400).json({ message: "Missing signature or webhook secret" });
            }

            let event: Stripe.Event;
            try {
                event = stripe!.webhooks.constructEvent(
                    req.body, // raw body
                    sig,
                    webhookSecret
                );
            } catch (err: any) {
                console.error("[Stripe] Webhook signature verification failed:", err.message);
                return res.status(400).json({ message: "Invalid signature" });
            }

            if (event.type === "checkout.session.completed") {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.client_reference_id;

                if (userId) {
                    await authStorage.updateUserTier(userId, "player", {
                        stripeCustomerId: session.customer as string,
                    });
                    console.log(`[Stripe] User ${userId} upgraded to player tier`);
                }
            }

            res.json({ received: true });
        }
    );
}
