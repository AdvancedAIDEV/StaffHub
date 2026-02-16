import { Calendar, Users, Clock, MessageSquare, Star, LayoutDashboard, CalendarRange, LogOut, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { User } from "@shared/models/auth";

const adminMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Staff", url: "/staff", icon: Users },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Reviews", url: "/reviews", icon: Star },
  { title: "Settings", url: "/settings", icon: Settings },
];

const staffMenuItems = [
  { title: "My Schedule", url: "/", icon: Calendar },
  { title: "Available Shifts", url: "/available-shifts", icon: CalendarRange },
  { title: "Time Tracking", url: "/time-tracking", icon: Clock },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "My Reviews", url: "/my-reviews", icon: Star },
  { title: "Settings", url: "/settings", icon: Settings },
];

function getInitials(user?: User | null): string {
  if (!user) return "??";
  const first = user.firstName?.[0] || "";
  const last = user.lastName?.[0] || "";
  if (first || last) return (first + last).toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  return "U";
}

function getDisplayName(user?: User | null): string {
  if (!user) return "User";
  if (user.firstName || user.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(" ");
  }
  return user.email || "User";
}

export function AppSidebar({ role = "admin", user }: { role?: "admin" | "staff"; user?: User | null }) {
  const [location] = useLocation();
  const menuItems = role === "admin" ? adminMenuItems : staffMenuItems;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">StaffHub</h2>
            <p className="text-xs text-muted-foreground">{role === "admin" ? "Admin Portal" : "Staff Portal"}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl || ""} />
            <AvatarFallback className="text-xs">{getInitials(user)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">{getDisplayName(user)}</p>
            <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">{user?.email || ""}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          size="sm"
          asChild
          data-testid="button-logout"
        >
          <a href="/api/logout">
            <LogOut className="h-4 w-4" />
            Log Out
          </a>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
