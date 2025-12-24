import { Link, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  ListTodo,
  Tag,
  BarChart3,
  FileCode,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
  Target,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Project } from '@/types/jira';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProjectSidebarProps {
  readonly project?: Project;
  readonly isCollapsed?: boolean;
  readonly onToggleCollapse?: () => void;
}

// Original terminology - legally distinct naming
const PROJECT_NAV_ITEMS = [
  { label: 'Planner', href: 'board', icon: LayoutGrid, description: 'Visual work planner' },
  { label: 'Queue', href: 'backlog', icon: ListTodo, description: 'Prioritized work queue' },
  { label: 'Milestones', href: 'releases', icon: Tag, description: 'Release milestones' },
  { label: 'Insights', href: 'reports', icon: BarChart3, description: 'Analytics & reports' },
  { label: 'Work Items', href: 'issues', icon: FileCode, description: 'All work items' },
  { label: 'Modules', href: 'components', icon: Layers, description: 'System modules' },
];

export function ProjectSidebar({ 
  project, 
  isCollapsed = false, 
  onToggleCollapse 
}: ProjectSidebarProps) {
  const location = useLocation();
  const baseUrl = project ? `/projects/${project.pkey}` : '';

  const isActive = (href: string) => {
    return location.pathname.includes(`${baseUrl}/${href}`);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          'bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Program Header */}
        {project && !isCollapsed && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-glow">
                {project.avatar_url ? (
                  <img 
                    src={project.avatar_url} 
                    alt={`${project.name} project avatar`}
                    className="w-full h-full rounded-xl"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">{project.pkey?.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm text-sidebar-foreground truncate">{project.name || project.pkey?.toLowerCase()}</h2>
                <p className="text-xs text-sidebar-muted flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Program
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Program Header - Collapsed */}
        {project && isCollapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-3 flex justify-center border-b border-sidebar-border">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                  <span className="text-white font-bold text-xs">{project.pkey?.slice(0, 2).toUpperCase()}</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {project.name || project.pkey}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Planning Section Header */}
        {!isCollapsed && (
          <div className="px-4 pt-5 pb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-sidebar-muted uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5" />
              Planning
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-2 px-2">
          {PROJECT_NAV_ITEMS.map((item) => {
            const linkContent = (
              <Link
                to={`${baseUrl}/${item.href}`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 rounded-lg group',
                  isActive(item.href)
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                  isCollapsed && 'justify-center px-0'
                )}
              >
                <item.icon 
                  className={cn(
                    'h-5 w-5 flex-shrink-0 transition-colors',
                    isActive(item.href) ? 'text-primary' : 'text-sidebar-muted group-hover:text-primary'
                  )} 
                />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <span className="block">{item.label}</span>
                  </div>
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    <p>{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}

        </nav>

        {/* Program Settings & Collapse */}
        <div className="border-t border-sidebar-border p-2">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={`${baseUrl}/settings`}
                  className="flex items-center justify-center p-2.5 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg transition-colors"
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Program Settings</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              to={`${baseUrl}/settings`}
              className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50"
            >
              <Settings className="h-5 w-5 text-sidebar-muted" />
              <span>Program Settings</span>
            </Link>
          )}

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className={cn(
              'w-full mt-1 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 h-10 rounded-lg transition-all',
              isCollapsed && 'justify-center'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 mr-2" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
