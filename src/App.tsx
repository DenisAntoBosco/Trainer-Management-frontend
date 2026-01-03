import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TrainerDashboard from "./pages/TrainerDashboard";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import TrainersPage from "./pages/TrainersPage";
import CalendarPage from "./pages/CalendarPage";
import HRRequestsPage from "./pages/HRRequestsPage";
import ReportsPage from "./pages/ReportsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";
import AttendancePage from "./pages/AttendancePage";
import DashboardLayout from "./components/layout/DashboardLayout";
import NotFound from "./pages/NotFound";
import RoleBasedRoute from "./components/RoleBasedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <AuthProvider>
          <DataProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/auth" element={<Navigate to="/login" replace />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/dashboard" element={<DashboardLayout><RoleBasedRoute allowedRoles={['admin', 'hr', 'project_manager']}><DashboardPage /></RoleBasedRoute></DashboardLayout>} />
                  <Route path="/trainer-dashboard" element={<DashboardLayout><RoleBasedRoute allowedRoles={['trainer']}><TrainerDashboard /></RoleBasedRoute></DashboardLayout>} />
                  <Route path="/projects" element={<DashboardLayout><RoleBasedRoute allowedRoles={['admin', 'project_manager']}><ProjectsPage /></RoleBasedRoute></DashboardLayout>} />
                  <Route path="/projects/:projectId" element={<DashboardLayout><RoleBasedRoute allowedRoles={['admin', 'project_manager']}><ProjectDetailPage /></RoleBasedRoute></DashboardLayout>} />
                  <Route path="/trainers" element={<DashboardLayout><RoleBasedRoute allowedRoles={['admin', 'hr', 'project_manager']}><TrainersPage /></RoleBasedRoute></DashboardLayout>} />
                  <Route path="/calendar" element={<DashboardLayout><CalendarPage /></DashboardLayout>} />
                  <Route path="/hr-requests" element={<DashboardLayout><RoleBasedRoute allowedRoles={['admin', 'hr', 'project_manager']}><HRRequestsPage /></RoleBasedRoute></DashboardLayout>} />
                  <Route path="/reports" element={<DashboardLayout><RoleBasedRoute allowedRoles={['admin', 'hr', 'project_manager']}><ReportsPage /></RoleBasedRoute></DashboardLayout>} />
                  <Route path="/profile" element={<DashboardLayout><ProfilePage /></DashboardLayout>} />
                  <Route path="/settings" element={<DashboardLayout><SettingsPage /></DashboardLayout>} />
                  <Route path="/users" element={<DashboardLayout><RoleBasedRoute allowedRoles={['admin']}><UsersPage /></RoleBasedRoute></DashboardLayout>} />
                  <Route path="/attendance" element={<DashboardLayout><AttendancePage /></DashboardLayout>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </DataProvider>
        </AuthProvider>
      </SettingsProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
