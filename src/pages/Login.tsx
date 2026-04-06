import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/admin");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-navy-cream" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 40% 60%, hsl(var(--gold) / 0.4) 0%, transparent 50%)"
        }} />
        <div className="relative z-10 max-w-md px-12">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
              <span className="text-navy font-display font-bold text-sm">NS</span>
            </div>
            <span className="font-display text-xl font-semibold text-navy-foreground">North Star Sanctuary</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-navy-foreground mb-4 leading-tight">
            Empowering teams to <span className="italic text-gold">change lives</span>
          </h2>
          <p className="text-navy-foreground/60 font-body leading-relaxed">
            Access your dashboard to manage cases, track outcomes, and make data-driven decisions
            that directly impact the survivors we serve.
          </p>
          <div className="mt-12 flex items-center gap-6 text-navy-foreground/40 text-xs font-body">
            <span>HIPAA Compliant</span>
            <span className="w-1 h-1 rounded-full bg-navy-foreground/30" />
            <span>256-bit Encryption</span>
            <span className="w-1 h-1 rounded-full bg-navy-foreground/30" />
            <span>SOC 2 Type II</span>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative">
        <button onClick={toggle} className="absolute top-6 right-6 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50" aria-label="Toggle theme">
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
              <span className="text-navy font-display font-bold text-xs">NS</span>
            </div>
            <span className="font-display text-lg font-semibold text-foreground">North Star Sanctuary</span>
          </div>

          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-sm text-muted-foreground font-body mb-8">Sign in to access your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body text-sm">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organization.org" className="h-11" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-body text-sm">Password</Label>
                <a href="#" className="text-xs text-gold hover:underline font-body">Forgot password?</a>
              </div>
              <div className="relative">
                <Input id="password" type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11 pr-10" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading}
              className="w-full h-11 bg-gold text-navy hover:bg-gold/90 font-body font-semibold gap-2">
              {loading ? "Signing in..." : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground font-body">or continue with</span></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-11 font-body text-sm" type="button">Google</Button>
              <Button variant="outline" className="h-11 font-body text-sm" type="button">Microsoft</Button>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground font-body">
            <Link to="/" className="text-gold hover:underline">← Back to Home</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
