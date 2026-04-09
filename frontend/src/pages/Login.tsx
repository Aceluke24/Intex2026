import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { API_BASE } from "@/lib/apiBase";
import { clearLoginRedirect, getLoginRedirect, resolvePostLoginPath } from "@/lib/loginRedirect";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { refetch } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedRedirect = searchParams.get("redirect");
  const safeRedirect = requestedRedirect && requestedRedirect.startsWith("/") ? requestedRedirect : null;

  const initialError = searchParams.get("externalError") ?? searchParams.get("error");
  const [error, setError] = useState<string | null>(
    initialError ? decodeURIComponent(initialError) : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = { email, password };
      if (requiresMfa && mfaCode) body.mfaCode = mfaCode;

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Invalid credentials.");
        return;
      }
      const data = await res.json();
      if (data.requiresMfa) {
        setRequiresMfa(true);
        return;
      }
      await refetch();
      const redirect = getLoginRedirect();
      const targetPath = resolvePostLoginPath(data.roles, redirect);
      clearLoginRedirect();
      navigate(safeRedirect ?? targetPath);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const params = new URLSearchParams({
      provider: "Google",
      returnPath: "/google-callback",
      frontendBase: window.location.origin,
    });
    window.location.assign(`${API_BASE}/api/auth/external-login?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — immersive branding */}
      <div className="hidden lg:flex lg:w-[55%] relative items-end overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 60% at 30% 80%, hsl(10 55% 50% / 0.18) 0%, transparent 70%)"
        }} />
        <div className="relative z-10 p-16 pb-20 max-w-lg">
          <Link to="/" className="inline-flex items-center gap-3 mb-10 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="North Star Sanctuary — Home">
            <BrandLogo variant="compact" />
            <span className="font-display text-lg font-semibold text-navy-foreground">North Star Sanctuary</span>
          </Link>
          <h2 className="font-display text-4xl font-bold text-navy-foreground leading-[1.1] mb-5">
            Empowering teams to <span className="italic text-terracotta">change lives</span>
          </h2>
          <p className="font-body text-sm text-navy-foreground/50 leading-relaxed">
            Access your dashboard to manage cases, track outcomes, and make
            data-driven decisions that directly impact the survivors we serve.
          </p>
          <div className="mt-14 flex items-center gap-6 text-navy-foreground/25 text-[11px] font-body tracking-wider uppercase">
            <span>HIPAA Compliant</span>
            <span>·</span>
            <span>256-bit Encrypted</span>
            <span>·</span>
            <span>SOC 2</span>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-background relative">
        <button onClick={toggle} className="absolute top-6 right-6 p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle theme">
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-7 h-7 rounded-full bg-terracotta flex items-center justify-center">
              <span className="text-terracotta-foreground font-display font-bold text-[10px]">NS</span>
            </div>
            <span className="font-display text-base font-semibold text-foreground">North Star</span>
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            {requiresMfa ? "Two-Factor Authentication" : "Welcome back"}
          </h1>
          <p className="font-body text-sm text-muted-foreground mb-10">
            {requiresMfa
              ? "Enter the 6-digit code from your authenticator app"
              : "Sign in to your dashboard"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!requiresMfa ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@organization.org" className="h-12 rounded-xl border-0 bg-secondary font-body" required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</Label>
                    <a href="#" className="text-xs text-terracotta hover:underline font-body">Forgot?</a>
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPw ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                      className="h-12 rounded-xl border-0 bg-secondary pr-10 font-body" required />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="mfaCode" className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">Authenticator Code</Label>
                <Input
                  id="mfaCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="h-12 rounded-xl border-0 bg-secondary font-body text-center text-xl tracking-widest"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setRequiresMfa(false); setMfaCode(""); setError(null); }}
                  className="text-xs text-muted-foreground hover:text-foreground font-body underline"
                >
                  ← Back to sign in
                </button>
              </div>
            )}
            {error && <p className="text-sm text-red-500 font-body">{error}</p>}
            <Button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 font-body font-medium gap-2 transition-all hover:shadow-lg hover:shadow-terracotta/15">
              {loading
                ? (requiresMfa ? "Verifying..." : "Signing in...")
                : <><span>{requiresMfa ? "Verify" : "Sign In"}</span><ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>

          {!requiresMfa && (
            <>
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                  <div className="relative flex justify-center text-[11px]"><span className="bg-background px-4 text-muted-foreground font-body uppercase tracking-wider">or</span></div>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3">
                  <Button
                    variant="ghost"
                    className="h-12 rounded-xl bg-secondary font-body text-sm"
                    type="button"
                    onClick={handleGoogleLogin}
                  >
                    Continue with Google
                  </Button>
                </div>
              </div>

              <p className="mt-8 text-center text-xs text-muted-foreground font-body">
                New donor?{" "}
                <Link to={safeRedirect ? `/signup?redirect=${encodeURIComponent(safeRedirect)}` : "/signup"} className="text-terracotta hover:underline">Create an account</Link>
              </p>
              <p className="mt-3 text-center text-xs text-muted-foreground font-body">
                Already signed in?{" "}
                <Link to="/mfa-setup" className="text-terracotta hover:underline">Set up 2FA</Link>
              </p>
              <p className="mt-3 text-center text-xs text-muted-foreground font-body">
                <Link to="/" className="text-terracotta hover:underline">← Back to Home</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
