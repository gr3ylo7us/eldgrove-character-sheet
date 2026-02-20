import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Key, Copy, Check, ArrowLeft, RefreshCw, Upload, Database, FileText, Loader2, Cloud, Link } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface AccessKey {
    id: number;
    key: string;
    createdAt: string;
    redeemedBy: string | null;
    redeemedAt: string | null;
}

interface ReseedResult {
    table: string;
    count: number;
}

const TABLE_LABELS: Record<string, string> = {
    weapons: "Weapons",
    armor: "Armor",
    items: "Items",
    skills: "Skills",
    archetypes: "Archetypes",
    feats: "Feats",
    maneuvers: "Maneuvers",
    languages: "Languages",
    leveling: "Leveling Table",
};

function extractSheetId(input: string): string {
    // For published URLs, pass the full URL so the server can detect the format
    if (input.includes("/spreadsheets/d/e/")) return input.trim();
    // For regular URLs, extract just the ID
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : input.trim();
}

export default function Admin() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [keys, setKeys] = useState<AccessKey[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Game data state
    const [isReseeding, setIsReseeding] = useState(false);
    const [reseedResults, setReseedResults] = useState<ReseedResult[] | null>(null);
    const [selectedTable, setSelectedTable] = useState("weapons");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Google Sheets sync state
    const [sheetUrl, setSheetUrl] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResults, setSyncResults] = useState<ReseedResult[] | null>(null);

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

    async function loadSheetUrl() {
        try {
            const res = await fetch("/api/admin/sheet-url", { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                if (data.sheetUrl) setSheetUrl(data.sheetUrl);
            }
        } catch { /* ignore */ }
    }

    useEffect(() => { loadKeys(); loadSheetUrl(); }, []);

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

    async function reseedAll() {
        setIsReseeding(true);
        setReseedResults(null);
        try {
            const res = await fetch("/api/admin/reseed", {
                method: "POST",
                credentials: "include",
            });
            const data = await res.json();
            if (res.ok) {
                setReseedResults(data.results);
                toast({ title: "Success!", description: data.message });
            } else {
                toast({ title: "Error", description: data.message, variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to re-seed data.", variant: "destructive" });
        } finally {
            setIsReseeding(false);
        }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const content = await file.text();
            const res = await fetch(`/api/admin/upload-csv/${selectedTable}`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "text/plain" },
                body: content,
            });
            const data = await res.json();
            if (res.ok) {
                toast({ title: "Success!", description: `${data.table}: ${data.count} rows imported` });
                setReseedResults([data]);
            } else {
                toast({ title: "Upload failed", description: data.message, variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to upload CSV.", variant: "destructive" });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    async function syncFromGoogleSheets() {
        const sheetId = extractSheetId(sheetUrl);
        if (!sheetId || sheetId.length < 10) {
            toast({ title: "Invalid URL", description: "Please enter a valid Google Sheets URL or ID.", variant: "destructive" });
            return;
        }



        setIsSyncing(true);
        setSyncResults(null);
        try {
            const res = await fetch("/api/admin/sync-sheets", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sheetId }),
            });
            const data = await res.json();
            if (res.ok) {
                setSyncResults(data.results);
                const failed = (data.results as ReseedResult[]).filter(r => r.count === -1);
                if (failed.length > 0) {
                    toast({ title: "Partial sync", description: `${failed.length} tab(s) failed. Others updated successfully.`, variant: "destructive" });
                } else {
                    toast({ title: "Synced!", description: data.message });
                }
            } else {
                toast({ title: "Sync failed", description: data.message, variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to sync from Google Sheets.", variant: "destructive" });
        } finally {
            setIsSyncing(false);
        }
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
                        Admin Panel
                    </h1>
                    <Button variant="ghost" size="sm" onClick={loadKeys}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>

                {/* Google Sheets Sync Section */}
                <Card className="p-6 border-primary/20">
                    <div className="flex items-center gap-2 mb-4">
                        <Cloud className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Google Sheets Sync</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                        Pull the latest game data directly from your Google Sheet. The sheet must be{" "}
                        <span className="text-foreground font-medium">published to the web</span>{" "}
                        (File → Share → Publish to web).
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                        <div className="relative flex-1">
                            <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Paste Google Sheets URL or Sheet ID..."
                                value={sheetUrl}
                                onChange={(e) => setSheetUrl(e.target.value)}
                                className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <Button
                            onClick={syncFromGoogleSheets}
                            disabled={isSyncing || !sheetUrl.trim()}
                            size="sm"
                        >
                            {isSyncing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Cloud className="w-4 h-4 mr-1" />}
                            {isSyncing ? "Syncing..." : "Sync Now"}
                        </Button>
                    </div>

                    {/* Sync Results */}
                    {syncResults && (
                        <div className={`p-3 rounded-md border ${syncResults.some(r => r.count === -1) ? "bg-yellow-500/10 border-yellow-500/20" : "bg-green-500/10 border-green-500/20"}`}>
                            <span className={`text-sm font-medium flex items-center gap-1 mb-2 ${syncResults.some(r => r.count === -1) ? "text-yellow-400" : "text-green-400"}`}>
                                <Check className="w-4 h-4" /> Sync Complete
                            </span>
                            <div className="grid grid-cols-3 gap-1 text-xs">
                                {syncResults.map((r, i) => (
                                    <div key={i} className={`flex items-center gap-1 ${r.count === -1 ? "text-red-400" : "text-muted-foreground"}`}>
                                        <FileText className="w-3 h-3" />
                                        <span>
                                            {TABLE_LABELS[r.table] || r.table}:{" "}
                                            <span className={`font-mono ${r.count === -1 ? "text-red-400" : "text-foreground"}`}>
                                                {r.count === -1 ? "FAILED" : r.count}
                                            </span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <details className="mt-3">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            Required tab names in your Google Sheet
                        </summary>
                        <div className="mt-2 p-2 bg-muted/20 rounded text-xs text-muted-foreground space-y-0.5">
                            <div>• <code>WEAPONS</code> — weapons table</div>
                            <div>• <code>ARMOR</code> — armor table</div>
                            <div>• <code>ITEMS</code> — items table</div>
                            <div>• <code>SKILLS</code> — skills table</div>
                            <div>• <code>ARCHETYPES</code> — archetypes table</div>
                            <div>• <code>FEATS AND MANEUVERS</code> — feats + maneuvers</div>
                            <div>• <code>LANGUAGES</code> — languages table</div>
                            <div>• <code>LEVELING TABLE</code> — leveling table</div>
                        </div>
                    </details>
                </Card>

                {/* Game Data Management Section (CSV fallback) */}
                <Card className="p-6 border-border/30">
                    <details>
                        <summary className="flex items-center gap-2 cursor-pointer">
                            <Database className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-lg font-semibold text-muted-foreground">Manual CSV Management</h2>
                        </summary>
                        <p className="text-sm text-muted-foreground mt-3 mb-4">
                            Fallback option: manually upload CSV files or re-seed from server files.
                        </p>

                        {/* Re-seed All */}
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md mb-4">
                            <div>
                                <span className="font-medium text-sm">Re-seed All Tables</span>
                                <p className="text-xs text-muted-foreground">Re-imports all 9 game data tables from the CSV files on the server.</p>
                            </div>
                            <Button onClick={reseedAll} disabled={isReseeding} size="sm" variant="secondary">
                                {isReseeding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                                {isReseeding ? "Seeding..." : "Re-seed All"}
                            </Button>
                        </div>

                        {/* Upload Individual CSV */}
                        <div className="p-3 bg-muted/30 rounded-md mb-4">
                            <span className="font-medium text-sm">Upload CSV for Specific Table</span>
                            <p className="text-xs text-muted-foreground mb-3">
                                Export a tab from your Google Sheet as CSV and upload it here.
                            </p>
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedTable}
                                    onChange={(e) => setSelectedTable(e.target.value)}
                                    className="bg-background border border-border rounded-md px-3 py-1.5 text-sm flex-1"
                                >
                                    {Object.entries(TABLE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                                    {isUploading ? "Uploading..." : "Upload CSV"}
                                </Button>
                            </div>
                        </div>

                        {/* CSV Results */}
                        {reseedResults && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                                <span className="text-sm font-medium text-green-400 flex items-center gap-1 mb-2">
                                    <Check className="w-4 h-4" /> Import Complete
                                </span>
                                <div className="grid grid-cols-3 gap-1 text-xs">
                                    {reseedResults.map((r) => (
                                        <div key={r.table} className="flex items-center gap-1 text-muted-foreground">
                                            <FileText className="w-3 h-3" />
                                            <span>{TABLE_LABELS[r.table] || r.table}: <span className="text-foreground font-mono">{r.count}</span></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </details>
                </Card>

                {/* Access Keys Section */}
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
