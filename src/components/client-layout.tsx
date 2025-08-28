'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInput,
  SidebarGroup,
} from '@/components/ui/sidebar';
import { MessageSquare, Search, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EchoSphereLogo } from '@/components/icons';
import { useCurrentUser } from '@/hooks/use-current-user';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentUser = useCurrentUser();

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center p-2 rounded-lg bg-primary/20 text-primary">
              <EchoSphereLogo className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold">EchoSphere</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <SidebarInput placeholder="Search..." className="pl-8" />
            </div>
          </SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/topics" className="w-full">
                <SidebarMenuButton
                  isActive={isActive('/topics')}
                  tooltip="Topics"
                >
                  <MessageSquare />
                  <span>Topics</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/chat" className="w-full">
                <SidebarMenuButton isActive={isActive('/chat')} tooltip="Chat">
                  <Users />
                  <span>Chat</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {currentUser && (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent">
              <Avatar>
                <AvatarImage src={currentUser.avatar ?? undefined} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{currentUser.name}</span>
                <span className="text-xs text-muted-foreground">
                  View Profile
                </span>
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b md:justify-end">
          <SidebarTrigger className="md:hidden" />
          {/* Add header content if needed, e.g. breadcrumbs or page title */}
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
