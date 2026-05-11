import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth, ROLE_LABEL } from "@/lib/auth";
import { cidadeNome } from "@/lib/mock-data";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b bg-background px-4">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-sm font-medium">{ROLE_LABEL[user.role]}</h1>
              {user.cidadeId && (
                <p className="text-xs text-muted-foreground">{cidadeNome(user.cidadeId)}</p>
              )}
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
