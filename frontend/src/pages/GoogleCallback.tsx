import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { clearLoginRedirect, getLoginRedirect, resolvePostLoginPath } from "@/lib/loginRedirect";

const GoogleCallback = () => {
  const { refetch, user, loading } = useAuth();
  const navigate = useNavigate();

  // On mount, force a session refresh in case the cookie was just set by Google callback
  useEffect(() => {
    refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once loading settles, redirect based on origin/role
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login?externalError=Sign+in+failed", { replace: true });
      return;
    }
    const redirect = getLoginRedirect();
    const targetPath = resolvePostLoginPath(user.roles, redirect);
    clearLoginRedirect();
    navigate(targetPath, { replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
        <p className="font-body text-sm text-muted-foreground">Completing sign in…</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
