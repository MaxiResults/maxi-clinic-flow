import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUnread } from "@/contexts/UnreadContext";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  UserCheck,
  Package,
  Settings,
  LogOut,
  KanbanSquare,
  CalendarCheck,
  FileText,
  Bot,
  BookOpen,
  BarChart3,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Itens sempre visíveis (Core)
const coreItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Pipeline CRM", url: "/pipeline", icon: KanbanSquare },
  { title: "Agendamentos", url: "/agendamentos", icon: Calendar },
  { title: "Anamnese", url: "/anamneses", icon: FileText },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

// Itens visíveis com WhatsApp (plano Profissional ou Premium)
const whatsappItems = [
  { title: "Conversas", url: "/conversas", icon: MessageSquare },
];

// Itens visíveis com IA (plano Premium)
const iaItems = [
  { title: "Assistente IA", url: "/configuracoes/ia", icon: Bot },
  { title: "Knowledge Base", url: "/ia/knowledge-base", icon: BookOpen },
  { title: "Analytics IA", url: "/analytics/ia", icon: BarChart3 },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { totalUnread } = useUnread();

  const hasWhatsApp   = user?.features?.whatsapp      === true;
  const hasIA         = user?.features?.ai_assistant  === true;

  // Montar menu dinamicamente conforme plano
  const menuItems = [
    ...coreItems,
    ...(hasWhatsApp ? whatsappItems : []),
    ...(hasIA       ? iaItems       : []),
  ];

  const initials = user?.nome
    ? user.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <span className="text-lg font-bold text-sidebar-primary-foreground">M</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Maxi IA</h1>
            <p className="text-xs text-sidebar-foreground/60">Automação WhatsApp</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex items-center gap-2 flex-1">
                          {item.title}
                          {item.url === "/conversas" && totalUnread > 0 && (
                            <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                              {totalUnread > 99 ? '99+' : totalUnread}
                            </span>
                          )}
                        </span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Integrações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/configuracoes/google-calendar"
                    end
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      location.pathname === "/configuracoes/google-calendar"
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <CalendarCheck className="h-4 w-4" />
                    <span>Google Calendar</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/perfil")} className="flex items-center gap-2 rounded-md hover:bg-sidebar-accent/50 p-1 transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar_url || ""} />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-medium text-sidebar-foreground">{user?.nome || "Usuário"}</p>
              <p className="text-xs text-sidebar-foreground/60">{user?.email || ""}</p>
            </div>
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-md hover:bg-sidebar-accent transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4 text-sidebar-foreground/80" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
