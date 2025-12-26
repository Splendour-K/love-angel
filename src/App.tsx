import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ResponsiveHeader } from "@/components/ResponsiveHeader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Discover from "./pages/Discover";
import Browse from "./pages/Browse";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Privacy from "./pages/Privacy";
import Safety from "./pages/Safety";
import Contact from "./pages/Contact";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminVerifications from "./pages/admin/AdminVerifications";
import AdminUsers from "./pages/admin/AdminUsers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="love-angel-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Main App Routes */}
              <Route path="/" element={<><ResponsiveHeader /><Landing /></>} />
              <Route path="/auth" element={<><ResponsiveHeader /><Auth /></>} />
              <Route path="/onboarding" element={<><ResponsiveHeader /><Onboarding /></>} />
              <Route path="/discover" element={<><ResponsiveHeader /><Discover /></>} />
              <Route path="/browse" element={<><ResponsiveHeader /><Browse /></>} />
              <Route path="/matches" element={<><ResponsiveHeader /><Matches /></>} />
              <Route path="/messages" element={<><ResponsiveHeader /><Messages /></>} />
              <Route path="/messages/:conversationId" element={<><ResponsiveHeader /><Chat /></>} />
              <Route path="/profile" element={<><ResponsiveHeader /><Profile /></>} />
              <Route path="/privacy" element={<><ResponsiveHeader /><Privacy /></>} />
              <Route path="/safety" element={<><ResponsiveHeader /><Safety /></>} />
              <Route path="/contact" element={<><ResponsiveHeader /><Contact /></>} />
              <Route path="/about" element={<><ResponsiveHeader /><About /></>} />
              
              {/* Admin Routes (scoped provider) */}
              <Route
                path="/admin/login"
                element={
                  <AdminAuthProvider>
                    <AdminLogin />
                  </AdminAuthProvider>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminAuthProvider>
                    <AdminDashboard />
                  </AdminAuthProvider>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<div />} />
                <Route path="messages" element={<AdminMessages />} />
                <Route path="verifications" element={<AdminVerifications />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>
              
              <Route path="*" element={<><ResponsiveHeader /><NotFound /></>} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
