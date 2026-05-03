import { Link, useLocation } from "wouter";
import { BarChart3, FolderSearch, Settings, Film, Library } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const [location] = useLocation();

  const items = [
    { title: "Library", url: "/", icon: Library },
    { title: "Scan Library", url: "/scan", icon: FolderSearch },
    { title: "Statistics", url: "/stats", icon: BarChart3 },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  return (
    <Sidebar variant="inset" collapsible="none">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/" className="flex flex-col items-center py-4 px-3 gap-1 group">
          <img
            src="/monomax-logo.png"
            alt="Monomax – Home Cinema"
            className="w-full max-w-[175px] object-contain"
            draggable={false}
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
