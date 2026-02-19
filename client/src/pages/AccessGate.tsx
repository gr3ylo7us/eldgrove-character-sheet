import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Key, Sparkles, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function AccessGate() {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const [key, setKey] = useState("");
    const [isRedeeming, setIsRedeeming] = useState(false);

    async function redeemKey() {
        if (!key.trim()) return;
        setIsRedeeming(true);
        try {
            const res = await fetch("/api/keys/redeem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ key: key.trim().toUpperCase() }),
            });
            const data = await res.json();
            if (res.ok) {
                toast({ title: "Access granted!", description: "Welcome to Eldgrove Chronicles." });
                queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            } else {
                toast({ title: "Invalid key", description: data.message || "That key is not valid.", variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
        } finally {
            setIsRedeeming(false);
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 space-y-6 border-primary/20">
                <div className="text-center space-y-2">
                    <Sparkles className="w-10 h-10 text-primary mx-auto" />
                    <h1
                        className="text-2xl text-primary"
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        Welcome, {user?.firstName || "Adventurer"}!
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Eldgrove Chronicles is currently in <strong>private beta</strong>.
                        Enter an access key to begin your journey.
                    </p>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Access Key</label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="ELDG-XXXX-XXXX-XXXX"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && redeemKey()}
                            className="font-mono tracking-wider uppercase"
                            data-testid="input-access-key"
                        />
                        <Button
                            onClick={redeemKey}
                            disabled={isRedeeming || !key.trim()}
                            data-testid="button-redeem-key"
                        >
                            <Key className="w-4 h-4 mr-1" />
                            {isRedeeming ? "..." : "Redeem"}
                        </Button>
                    </div>
                </div>

                <div className="pt-2 border-t border-border/40 text-center">
                    <p className="text-xs text-muted-foreground mb-3">
                        Don't have a key? Ask the GM or game creator for one.
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => logout()} className="text-muted-foreground">
                        <LogOut className="w-3 h-3 mr-1" /> Sign out
                    </Button>
                </div>
            </Card>
        </div>
    );
}
