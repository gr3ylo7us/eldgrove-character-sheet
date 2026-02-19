import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Key, Copy, Check, ArrowLeft, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface AccessKey {
    id: number;
    key: string;
    createdAt: string;
    redeemedBy: string | null;
    redeemedAt: string | null;
}

export default function Admin() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [keys, setKeys] = useState<AccessKey[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    async function loadKeys() {
        try {
            const res = await fetch("/api/admin/keys", { credentials: "include" });
            if (res.ok) {
                setKeys(await res.json());
            } else {
                toast({ title: "Error", description: "Failed to load keys. You may not have admin access.", variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to connect to server.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => { loadKeys(); }, []);

    async function generateKey() {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/admin/keys/generate", {
                method: "POST",
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                toast({ title: "Key generated!", description: data.key });
                loadKeys();
            } else {
                toast({ title: "Error", description: "Failed to generate key.", variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    }

    function copyKey(key: string) {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        toast({ title: "Copied!", description: key });
        setTimeout(() => setCopiedKey(null), 2000);
    }

    const availableKeys = keys.filter((k) => !k.redeemedBy);
    const usedKeys = keys.filter((k) => k.redeemedBy);

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <a href="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                        </a>
                    </div>
                    <h1
                        className="text-xl text-primary"
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        Admin — Access Keys
                    </h1>
                    <Button variant="ghost" size="sm" onClick={loadKeys}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>

                <Card className="p-6 border-primary/20">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold">Generate Access Key</h2>
                            <p className="text-sm text-muted-foreground">
                                Create a key to give to a beta tester. Each key works once.
                            </p>
                        </div>
                        <Button onClick={generateKey} disabled={isGenerating}>
                            <Key className="w-4 h-4 mr-1" />
                            {isGenerating ? "Generating..." : "Generate Key"}
                        </Button>
                    </div>
                </Card>

                {isLoading ? (
                    <div className="text-center text-muted-foreground py-8">Loading keys...</div>
                ) : (
                    <>
                        {availableKeys.length > 0 && (
                            <Card className="p-6 border-primary/20">
                                <h2 className="text-lg font-semibold mb-3 text-green-400">
                                    Available Keys ({availableKeys.length})
                                </h2>
                                <div className="space-y-2">
                                    {availableKeys.map((k) => (
                                        <div
                                            key={k.id}
                                            className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                                        >
                                            <code className="font-mono tracking-wider text-sm">{k.key}</code>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyKey(k.key)}
                                            >
                                                {copiedKey === k.key ? (
                                                    <Check className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {usedKeys.length > 0 && (
                            <Card className="p-6 border-border/30">
                                <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
                                    Redeemed Keys ({usedKeys.length})
                                </h2>
                                <div className="space-y-2">
                                    {usedKeys.map((k) => (
                                        <div
                                            key={k.id}
                                            className="flex items-center justify-between p-3 bg-muted/20 rounded-md opacity-60"
                                        >
                                            <div>
                                                <code className="font-mono tracking-wider text-sm line-through">
                                                    {k.key}
                                                </code>
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    used by {k.redeemedBy}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {keys.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                No keys generated yet. Click "Generate Key" to create one.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
