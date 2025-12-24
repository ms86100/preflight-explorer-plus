import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Header } from './Header';
import { ProjectSidebar } from './ProjectSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface AppLayoutProps {
  readonly children?: React.ReactNode;
  readonly showSidebar?: boolean;
  readonly projectKey?: string;
}

export function AppLayout({ children, showSidebar = true, projectKey }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { clearanceLevel } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Check if we're in a project context
  const isProjectView = projectKey || (location.pathname.startsWith('/projects/') && 
    location.pathname.split('/').length > 2);

  // Get project key from props or URL
  const currentProjectKey = projectKey || location.pathname.split('/')[2];

  // Mock project for demo - in real app, fetch from route params
  const mockProject = isProjectView ? {
    id: '1',
    pkey: currentProjectKey || 'PROJ',
    name: currentProjectKey === 'MRTT' ? 'MRTT Program' : currentProjectKey || 'Program',
    project_type: 'software' as const,
    template: 'scrum' as const,
    issue_counter: 0,
    is_archived: false,
    classification: currentProjectKey === 'MRTT' ? 'export_controlled' as const : 'restricted' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header - Compact on mobile */}
      <Header 
        onMobileSidebarToggle={() => setMobileSidebarOpen(true)} 
        showMobileSidebarToggle={!!(showSidebar && isProjectView)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Project Sidebar - Desktop */}
        {showSidebar && isProjectView && !isMobile && (
          <ProjectSidebar
            project={mockProject}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* Project Sidebar - Mobile Sheet */}
        {showSidebar && isProjectView && isMobile && (
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetContent side="left" className="p-0 w-[280px]">
              <ProjectSidebar
                project={mockProject}
                isCollapsed={false}
                onToggleCollapse={() => setMobileSidebarOpen(false)}
                isMobile
                onNavigate={() => setMobileSidebarOpen(false)}
              />
            </SheetContent>
          </Sheet>
        )}

        {/* Main Content - Add bottom padding for mobile nav */}
        <main className={cn(
          'flex-1 overflow-auto pb-safe-nav',
          isProjectView ? 'bg-gradient-vertex' : 'bg-background'
        )}>
          {children || <Outlet />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
