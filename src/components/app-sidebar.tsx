import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, UserPlus, Inbox, ListChecks, BarChart3, LogOut, Building2, BrickWall,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth, ROLE_LABEL, type Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cidadeNome } from "@/lib/mock-data";

type Item = { title: string; url: string; icon: typeof Users; roles: Role[] };

const ITEMS: Item[] = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, roles: ["gestor", "coordenador", "adm", "sdr", "corretor"] },
  { title: "Analytics", url: "/app/analytics", icon: BarChart3, roles: ["gestor"] },
  { title: "Usuários", url: "/app/users", icon: Users, roles: ["gestor"] },
  { title: "Empreendimentos", url: "/app/empreendimentos", icon: BrickWall, roles: ["gestor"] },
  { title: "Novo Lead", url: "/app/leads/new", icon: UserPlus, roles: ["gestor", "sdr"] },
  { title: "Distribuição", url: "/app/distribution", icon: Inbox, roles: ["gestor", "adm"] },
  { title: "Meus Leads", url: "/app/my-leads", icon: ListChecks, roles: ["corretor"] },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });

  if (!user) return null;
  const items = ITEMS.filter((i) => i.roles.includes(user.role));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">LeadFlow</span>
              <span className="text-xs text-muted-foreground">Imobiliário</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = path === item.url || (item.url !== "/app" && path.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        {!collapsed && (
          <div className="px-2 py-2">
            <p className="text-sm font-medium truncate">{user.nome}</p>
            <p className="text-xs text-muted-foreground truncate">{ROLE_LABEL[user.role]}</p>
            {user.cidadeId && (
              <p className="text-xs text-muted-foreground">{cidadeNome(user.cidadeId)}</p>
            )}
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={logout} className="justify-start">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
