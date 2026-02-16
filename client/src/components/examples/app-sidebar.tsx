import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "../app-sidebar";

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role="admin" />
        <div className="flex-1 p-8">
          <h2 className="text-xl font-semibold">Sidebar Preview</h2>
          <p className="text-muted-foreground mt-2">This is the admin sidebar with navigation items.</p>
        </div>
      </div>
    </SidebarProvider>
  );
}
