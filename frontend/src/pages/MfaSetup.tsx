import { useEffect, useState } from "react";
import { QRCode } from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/lib/apiBase";
import { ShieldCheck, ShieldOff, Copy, CheckCheck } from "lucide-react";

interface MfaSetupData {
  key: string;
  otpUri: string;
  isEnabled: boolean;
}

const MfaSetup = () => {
  const { refetch } = useAuth();
  const [setup, setSetup] = useState<MfaSetupData | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/mfa/setup`, { credentials: "include" })
      .then((r) => r.json())
      .then(setSetup)
      .catch(() => setError("Failed to load MFA setup."));
  }, []);

  const copyKey = async () => {
    if (!setup) return;
    await navigator.clipboard.writeText(setup.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/mfa/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "Failed to enable MFA.");
        return;
      }
      setSuccess("Two-factor authentication enabled successfully.");
      setCode("");
      await refetch();
      setSetup((prev) => prev ? { ...prev, isEnabled: true } : prev);
    } catch {
      setError("Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/mfa/disable`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "Failed to disable MFA.");
        return;
      }
      setSuccess("Two-factor authentication disabled.");
      await refetch();
      // Re-fetch setup to get new key
      const setupRes = await fetch(`${API_BASE}/api/auth/mfa/setup`, { credentials: "include" });
      setSetup(await setupRes.json());
    } catch {
      setError("Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  };

  if (!setup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-body text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="w-7 h-7 text-terracotta" />
          <h1 className="font-display text-2xl font-bold text-foreground">Two-Factor Authentication</h1>
        </div>

        {setup.isEnabled ? (
          <div className="space-y-6">
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
              <p className="font-body text-sm text-green-700 dark:text-green-400">
                Two-factor authentication is <strong>enabled</strong> on your account.
              </p>
            </div>
            {error && <p className="text-sm text-red-500 font-body">{error}</p>}
            {success && <p className="text-sm text-green-600 font-body">{success}</p>}
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl font-body gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={handleDisable}
              disabled={loading}
            >
              <ShieldOff className="w-4 h-4" />
              {loading ? "Disabling…" : "Disable Two-Factor Authentication"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="font-body text-sm text-muted-foreground">
              Scan the QR code below with an authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code to activate.
            </p>

            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <QRCode value={setup.otpUri} size={200} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Manual entry key
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm bg-secondary rounded-lg px-3 py-2 break-all select-all">
                  {setup.key}
                </code>
                <Button variant="ghost" size="icon" onClick={copyKey} className="shrink-0 rounded-lg">
                  {copied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <form onSubmit={handleEnable} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Verification Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="h-12 rounded-xl border-0 bg-secondary font-body text-center text-xl tracking-widest"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500 font-body">{error}</p>}
              {success && <p className="text-sm text-green-600 font-body">{success}</p>}
              <Button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full h-12 rounded-xl bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 font-body font-medium"
              >
                {loading ? "Verifying…" : "Enable Two-Factor Authentication"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default MfaSetup;
