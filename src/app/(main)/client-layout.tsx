
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
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageSquare, Users, LogOut, BarChart, Shield, Settings, User as UserIcon, Info, Vote, ListChecks, FileText } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EchoSphereLogo } from '@/components/icons';
import { logout } from '@/app/actions';
import { useState } from 'react';
import type { User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

type NotificationState = {
    hasNewPolls?: boolean;
    hasNewVotesOnMyPolls?: boolean;
    hasNewTopics?: boolean;
    hasNewRepliesToMyTopics?: boolean;
    hasNewCommunityReviewItems?: boolean;
}

export function ClientLayout({ children, currentUser, notifications = {} }: { children: React.ReactNode, currentUser: User | null, notifications: NotificationState }) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    // The redirect in logout() will prevent setIsLoggingOut(false) from being called,
    // which is the desired behavior.
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center p-2 rounded-lg bg-primary/20 text-primary">
              <EchoSphereLogo className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold">Vox Populi</h1>
          </div>
        </SidebarHeader>
        
        {currentUser && (
          <div className="p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={isLoggingOut}>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer">
                  <Avatar>
                    <AvatarImage
                      src={currentUser.avatar ?? undefined}
                      alt={currentUser.name}
                    />
                    <AvatarFallback>
                      {currentUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-medium truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {currentUser.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 ml-2" side="bottom" align="start">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/my-statistics">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>My Statistics</span>
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        <Separator className="mx-2" />

        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/polls" className="w-full">
                <SidebarMenuButton
                  isActive={isActive('/polls')}
                  tooltip="Polls"
                >
                  <Vote />
                  <span>Polls</span>
                   {notifications.hasNewPolls && <NotificationDot />}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/my-polls" className="w-full">
                <SidebarMenuButton
                  isActive={isActive('/my-polls')}
                  tooltip="My Polls"
                >
                  <ListChecks />
                  <span>My Polls</span>
                   {notifications.hasNewVotesOnMyPolls && <NotificationDot />}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/topics" className="w-full">
                <SidebarMenuButton
                  isActive={isActive('/topics')}
                  tooltip="Topics"
                >
                  <MessageSquare />
                  <span>Topics</span>
                  {notifications.hasNewTopics && <NotificationDot />}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <Link href="/my-topics" className="w-full">
                <SidebarMenuButton
                  isActive={isActive('/my-topics')}
                  tooltip="My Topics"
                >
                  <FileText />
                  <span>My Topics</span>
                   {notifications.hasNewRepliesToMyTopics && <NotificationDot />}
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
             <SidebarMenuItem>
              <Link href="/statistics" className="w-full">
                <SidebarMenuButton
                  isActive={isActive('/statistics')}
                  tooltip="Statistics"
                >
                  <BarChart />
                  <span>Statistics</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/community-review" className="w-full">
                <SidebarMenuButton
                  isActive={isActive('/community-review')}
                  tooltip="Community Review"
                >
                  <Shield />
                  <span>Community Review</span>
                  {notifications.hasNewCommunityReviewItems && <NotificationDot />}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/about" className="w-full">
                <SidebarMenuButton
                  isActive={isActive('/about')}
                  tooltip="About"
                >
                  <Info />
                  <span>About</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {/* Footer is now empty but preserved for layout consistency */}
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


function NotificationDot() {
    return (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
        </div>
    )
}
