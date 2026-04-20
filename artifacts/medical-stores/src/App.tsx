import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import StoreDetail from "@/pages/store-detail";
import OwnerLogin from "@/pages/owner/login";
import OwnerSignup from "@/pages/owner/signup";
import OwnerDashboard from "@/pages/owner/dashboard";
import NewStore from "@/pages/owner/stores/new";
import EditStore from "@/pages/owner/stores/edit";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminStoreDetail from "@/pages/admin/stores/detail";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Home} />
        <Route path="/stores/:id" component={StoreDetail} />
        <Route path="/owner/login" component={OwnerLogin} />
        <Route path="/owner/signup" component={OwnerSignup} />
        <Route path="/admin/login" component={AdminLogin} />

        {/* Protected Owner Routes */}
        <Route path="/owner/dashboard">
          <ProtectedRoute allowedRoles={["owner"]}>
            <OwnerDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/owner/stores/new">
          <ProtectedRoute allowedRoles={["owner"]}>
            <NewStore />
          </ProtectedRoute>
        </Route>
        <Route path="/owner/stores/:id/edit">
          <ProtectedRoute allowedRoles={["owner"]}>
            <EditStore />
          </ProtectedRoute>
        </Route>

        {/* Protected Admin Routes */}
        <Route path="/admin/dashboard">
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/stores/:id">
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminStoreDetail />
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
