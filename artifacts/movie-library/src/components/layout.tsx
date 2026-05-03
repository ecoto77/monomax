import { Link, useLocation } from "wouter";
import { Film, BarChart3, FolderSearch, Settings } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const [location] = useLocation();

  const items = [
    { title: "Library", url: "/", icon: Film },
    { title: "Scan Library", url: "/scan", icon: FolderSearch },
    { title: "Statistics", url: "/stats", icon: BarChart3 },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  return (
    <Sidebar variant="inset" collapsible="none">
      <SidebarHeader className="flex h-16 items-center px-4 md:px-6 border-b">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
          <Film className="h-5 w-5" />
          <span>Cinemarchive</span>
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
      <div className="flex min-h-screen w-full bg-muted/20">
        <AppSidebar />
        <main className="flex-1 w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
