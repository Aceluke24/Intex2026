import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AdminChromeProvider } from "@/contexts/AdminChromeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CookieConsentProvider } from "@/contexts/CookieConsentContext";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { CookieBanner } from "@/components/CookieBanner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ImpactDashboard from "./pages/ImpactDashboard.tsx";
import Login from "./pages/Login.tsx";
import SignUp from "./pages/SignUp.tsx";
import DonorsPage from "./pages/DonorsPage.tsx";
import CaseloadPage from "./pages/CaseloadPage.tsx";
import RecordingsPage from "./pages/RecordingsPage.tsx";
import VisitationsPage from "./pages/VisitationsPage.tsx";
import ReportsPage from "./pages/ReportsPage.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import About from "./pages/About.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import DonorPortal from "./pages/DonorPortal.tsx";
import DonatePage from "./pages/DonatePage.tsx";
import Mission from "./pages/Mission.tsx";
import GetInvolved from "./pages/GetInvolved.tsx";
import ProgramsDashboardPage from "./pages/ProgramsDashboardPage.tsx";
import FinanceDashboardPage from "./pages/FinanceDashboardPage.tsx";
import ExpensesPage from "./pages/ExpensesPage.tsx";
import OutreachPage from "./pages/OutreachPage.tsx";
import MfaSetup from "./pages/MfaSetup.tsx";
import GoogleCallback from "./pages/GoogleCallback.tsx";

const queryClient = new QueryClient();

function DashboardChromeLayout() {
  return (
    <AdminChromeProvider>
      <Outlet />
    </AdminChromeProvider>
  );
}

const App = () => (
  <CookieConsentProvider>
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <ScrollToTop />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/impact" element={<ImpactDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/about" element={<About />} />
              <Route path="/donate" element={<DonatePage />} />
              <Route path="/mission" element={<Mission />} />
              <Route path="/get-involved" element={<GetInvolved />} />

              {/* Google OAuth callback — public, handles its own redirect */}
              <Route path="/google-callback" element={<GoogleCallback />} />

              {/* MFA setup — any authenticated user */}
              <Route element={<ProtectedRoute />}>
                <Route path="/mfa-setup" element={<MfaSetup />} />
              </Route>

              {/* Donor-only route */}
              <Route element={<ProtectedRoute requiredRole="Donor" />}>
                <Route path="/donor" element={<DonorPortal />} />
              </Route>

              {/* Admin-only routes */}
              <Route element={<ProtectedRoute requiredRole="Admin" />}>
                <Route element={<DashboardChromeLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/dashboard/donors" element={<DonorsPage />} />
                  <Route path="/dashboard/caseload" element={<CaseloadPage />} />
                  <Route path="/dashboard/recordings" element={<RecordingsPage />} />
                  <Route path="/dashboard/visitations" element={<VisitationsPage />} />
                  <Route path="/dashboard/reports" element={<ReportsPage />} />
                  <Route path="/dashboard/programs" element={<ProgramsDashboardPage />} />
                  <Route path="/dashboard/finance" element={<FinanceDashboardPage />} />
                  <Route path="/dashboard/expenses" element={<ExpensesPage />} />
                  <Route path="/dashboard/outreach" element={<OutreachPage />} />
                  <Route path="/dashboard/social-media" element={<Navigate to="/dashboard/outreach" replace />} />
                  <Route path="/dashboard/social" element={<Navigate to="/dashboard/outreach" replace />} />
                </Route>
              </Route>

              {/* Legacy redirects */}
              <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
              <Route path="/admin/donors" element={<Navigate to="/dashboard/donors" replace />} />
              <Route path="/admin/caseload" element={<Navigate to="/dashboard/caseload" replace />} />
              <Route path="/admin/recordings" element={<Navigate to="/dashboard/recordings" replace />} />
              <Route path="/admin/visitations" element={<Navigate to="/dashboard/visitations" replace />} />
              <Route path="/admin/reports" element={<Navigate to="/dashboard/reports" replace />} />
              <Route path="/admin/insights" element={<Navigate to="/dashboard/reports" replace />} />
              <Route path="/admin/social-media" element={<Navigate to="/dashboard/outreach" replace />} />
              <Route path="/admin/outreach" element={<Navigate to="/dashboard/outreach" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        <CookieBanner />
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
  </CookieConsentProvider>
);

export default App;
