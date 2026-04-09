import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { API_BASE } from "@/lib/apiBase";
import { useAuth } from "@/contexts/AuthContext";

const SignUp = () => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { refetch } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedRedirect = searchParams.get("redirect");
  const safeRedirect = requestedRedirect && requestedRedirect.startsWith("/") ? requestedRedirect : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 14) {
      setError("Password must be at least 14 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register-donor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, confirmPassword, displayName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Registration failed. Please try again.");
        return;
      }
      await refetch();
      navigate(safeRedirect ?? "/donate");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-[55%] relative items-end overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 60% at 30% 80%, hsl(10 55% 50% / 0.18) 0%, transparent 70%)"
        }} />
        <div className="relative z-10 p-16 pb-20 max-w-lg">
          <Link to="/" className="inline-flex items-center gap-3 mb-10 rounded-md focus-visible:outline-none" aria-label="North Star Sanctuary — Home">
            <BrandLogo variant="compact" />
            <span className="font-display text-lg font-semibold text-navy-foreground">North Star Sanctuary</span>
          </Link>
          <h2 className="font-display text-4xl font-bold text-navy-foreground leading-[1.1] mb-5">
            Join us in <span className="italic text-terracotta">making a difference</span>
          </h2>
          <p className="font-body text-sm text-navy-foreground/50 leading-relaxed">
            Create a donor account to track your contributions, see the impact of your generosity,
            and connect directly with the girls whose lives you are changing.
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

          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Create account</h1>
          <p className="font-body text-sm text-muted-foreground mb-8">Register as a donor</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="h-12 rounded-xl border-0 bg-secondary font-body"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 rounded-xl border-0 bg-secondary font-body"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Password <span className="normal-case text-muted-foreground/60">(min. 14 characters)</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••"
                  className="h-12 rounded-xl border-0 bg-secondary pr-10 font-body"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••••"
                className="h-12 rounded-xl border-0 bg-secondary font-body"
                required
              />
            </div>

            {error && <p className="text-sm text-red-500 font-body">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 font-body font-medium gap-2 transition-all hover:shadow-lg hover:shadow-terracotta/15"
            >
              {loading ? "Creating account…" : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground font-body">
            Already have an account?{" "}
            <Link to={safeRedirect ? `/login?redirect=${encodeURIComponent(safeRedirect)}` : "/login"} className="text-terracotta hover:underline">Sign in</Link>
          </p>
          <p className="mt-3 text-center text-xs text-muted-foreground font-body">
            <Link to="/" className="text-terracotta hover:underline">← Back to Home</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUp;
