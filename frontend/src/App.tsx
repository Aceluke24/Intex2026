import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { CookieBanner } from "@/components/CookieBanner";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ImpactDashboard from "./pages/ImpactDashboard.tsx";
import Login from "./pages/Login.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import DonorsPage from "./pages/DonorsPage.tsx";
import CaseloadPage from "./pages/CaseloadPage.tsx";
import RecordingsPage from "./pages/RecordingsPage.tsx";
import VisitationsPage from "./pages/VisitationsPage.tsx";
import ReportsPage from "./pages/ReportsPage.tsx";
import InsightsPage from "./pages/InsightsPage.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import About from "./pages/About.tsx";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/impact" element={<ImpactDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/donors" element={<DonorsPage />} />
            <Route path="/admin/caseload" element={<CaseloadPage />} />
            <Route path="/admin/recordings" element={<RecordingsPage />} />
            <Route path="/admin/visitations" element={<VisitationsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/insights" element={<InsightsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <CookieBanner />
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
