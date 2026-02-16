import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import AdminDashboard from "@/pages/admin-dashboard";
import StaffDashboard from "@/pages/staff-dashboard";
import StaffList from "@/pages/staff-list";
import StaffProfileView from "@/pages/staff-profile";
import EventDetail from "@/pages/event-detail";
import Messages from "@/pages/messages";
import Reviews from "@/pages/reviews";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import AvailableShifts from "@/pages/available-shifts";
import TimeTracking from "@/pages/time-tracking";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { StaffProfile } from "@shared/schema";

function AdminRouter() {
  return (
    <Switch>
      <Route path="/" component={AdminDashboard} />
      <Route path="/events/:id" component={EventDetail} />
      <Route path="/staff" component={StaffList} />
      <Route path="/staff/:userId" component={StaffProfileView} />
      <Route path="/messages" component={Messages} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function StaffRouter() {
  return (
    <Switch>
      <Route path="/" component={StaffDashboard} />
      <Route path="/available-shifts" component={AvailableShifts} />
      <Route path="/time-tracking" component={TimeTracking} />
      <Route path="/messages" component={Messages} />
      <Route path="/my-reviews" component={Reviews} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user } = useAuth();
  useWebSocket();
  const { data: profile } = useQuery<StaffProfile>({
    queryKey: ["/api/profile"],
  });

  const role = profile?.role === "admin" ? "admin" : "staff";

  const sidebarStyle = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role={role} user={user} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 px-6 py-3 border-b border-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            {role === "admin" ? <AdminRouter /> : <StaffRouter />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
