import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { PluginProvider } from "@/features/plugins";
import { SiteAccessGate } from "@/components/auth/SiteAccessGate";

// Pages
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/Auth";
import BoardPage from "./pages/BoardPage";
import ProjectsPage from "./pages/ProjectsPage";
import BacklogPage from "./pages/BacklogPage";
import IssuesPage from "./pages/IssuesPage";
import WorkflowsPage from "./pages/WorkflowsPage";
import CustomFieldsPage from "./pages/CustomFieldsPage";
import ReportsPage from "./pages/ReportsPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import ProjectSettingsPage from "./pages/ProjectSettingsPage";
import PluginsPage from "./pages/PluginsPage";
import AutomationPage from "./pages/AutomationPage";
import MigrationPage from "./pages/MigrationPage";
import LdapPage from "./pages/LdapPage";
import PluginFeaturesPage from "./pages/PluginFeaturesPage";
import ReleasesPage from "./pages/ReleasesPage";
import ComponentsPage from "./pages/ComponentsPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import DocsPage from "./pages/DocsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirects to dashboard if authenticated)
function PublicRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth Route */}
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />

      {/* Dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Projects */}
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/create"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectKey/board"
        element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectKey/backlog"
        element={
          <ProtectedRoute>
            <BacklogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectKey/issues"
        element={
          <ProtectedRoute>
            <IssuesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectKey/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectKey/settings"
        element={
          <ProtectedRoute>
            <ProjectSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectKey/releases"
        element={
          <ProtectedRoute>
            <ReleasesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectKey/components"
        element={
          <ProtectedRoute>
            <ComponentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectKey/*"
        element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        }
      />

      {/* Dashboards */}
      <Route
        path="/dashboards/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Issues */}
      <Route
        path="/issues"
        element={
          <ProtectedRoute>
            <IssuesPage />
          </ProtectedRoute>
        }
      />

      {/* Boards */}
      <Route
        path="/boards/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Plans */}
      <Route
        path="/plans/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Settings */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Workflows */}
      <Route
        path="/workflows"
        element={
          <ProtectedRoute>
            <WorkflowsPage />
          </ProtectedRoute>
        }
      />

      {/* Custom Fields */}
      <Route
        path="/custom-fields"
        element={
          <ProtectedRoute>
            <CustomFieldsPage />
          </ProtectedRoute>
        }
      />

      {/* Reports */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Profile */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Plugins */}
      <Route
        path="/plugins"
        element={
          <ProtectedRoute>
            <PluginsPage />
          </ProtectedRoute>
        }
      />

      {/* Automation */}
      <Route
        path="/automation"
        element={
          <ProtectedRoute>
            <AutomationPage />
          </ProtectedRoute>
        }
      />

      {/* Migration */}
      <Route
        path="/migration"
        element={
          <ProtectedRoute>
            <MigrationPage />
          </ProtectedRoute>
        }
      />

      {/* Plugin Features */}
      <Route
        path="/plugin-features"
        element={
          <ProtectedRoute>
            <PluginFeaturesPage />
          </ProtectedRoute>
        }
      />

      {/* LDAP */}
      <Route
        path="/ldap"
        element={
          <ProtectedRoute>
            <LdapPage />
          </ProtectedRoute>
        }
      />

      {/* OAuth Callback for Git Providers */}
      <Route path="/oauth/git/callback" element={<OAuthCallbackPage />} />

      {/* Documentation */}
      <Route path="/docs" element={<DocsPage />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SiteAccessGate>
          <AuthProvider>
            <PluginProvider>
              <AppRoutes />
            </PluginProvider>
          </AuthProvider>
        </SiteAccessGate>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
