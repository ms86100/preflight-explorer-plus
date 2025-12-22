import { Link, useLocation } from 'react-router-dom';
import {
  Kanban,
  ListTodo,
  Tag,
  BarChart3,
  FileCode,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  FolderKanban,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Project } from '@/types/jira';

interface ProjectSidebarProps {
  project?: Project;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const PROJECT_NAV_ITEMS = [
  { label: 'Kanban board', href: 'board', icon: Kanban },
  { label: 'Backlog', href: 'backlog', icon: ListTodo },
  { label: 'Releases', href: 'releases', icon: Tag },
  { label: 'Reports', href: 'reports', icon: BarChart3 },
  { label: 'Issues', href: 'issues', icon: FileCode },
  { label: 'Components', href: 'components', icon: Layers },
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
    <aside 
      className={cn(
        'bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200',
        isCollapsed ? 'w-14' : 'w-60'
      )}
    >
      {/* Project Header */}
      {project && !isCollapsed && (
        <div className="p-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center flex-shrink-0">
              {project.avatar_url ? (
                <img 
                  src={project.avatar_url} 
                  alt={project.name} 
                  className="w-full h-full rounded"
                />
              ) : (
                <span className="text-white font-bold text-sm">{project.pkey?.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-medium text-sm text-sidebar-foreground truncate">{project.pkey?.toLowerCase()}</h2>
              <p className="text-xs text-sidebar-muted">
                Software project
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Project Header - Collapsed */}
      {project && isCollapsed && (
        <div className="p-2 flex justify-center border-b border-sidebar-border">
          <div className="w-9 h-9 rounded bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">{project.pkey?.slice(0, 2).toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Board Section */}
      {!isCollapsed && (
        <div className="px-3 pt-4 pb-1">
          <span className="text-xs font-medium text-sidebar-muted flex items-center gap-1">
            <Kanban className="h-3 w-3" />
            {project?.pkey} board
            <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-1">
        {PROJECT_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            to={`${baseUrl}/${item.href}`}
            className={cn(
              'flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors mx-1 rounded-sm',
              isActive(item.href)
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
              isCollapsed && 'justify-center mx-0 px-0'
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive(item.href) ? 'text-primary' : 'text-sidebar-muted')} />
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        ))}

        {/* Project Shortcuts Section */}
        {!isCollapsed && (
          <div className="mt-6 mx-3">
            <div className="text-xs font-semibold text-sidebar-muted uppercase tracking-wide mb-2">
              Project Shortcuts
            </div>
            <p className="text-xs text-sidebar-muted leading-relaxed mb-2">
              Add a link to useful information for your whole team to see.
            </p>
            <button
              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add shortcut
            </button>
          </div>
        )}
      </nav>

      {/* Project Settings */}
      <div className="border-t border-sidebar-border p-1">
        <Link
          to={`${baseUrl}/settings`}
          className={cn(
            'flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors rounded-sm',
            'text-sidebar-foreground hover:bg-sidebar-accent/50',
            isCollapsed && 'justify-center px-0'
          )}
          title={isCollapsed ? 'Project settings' : undefined}
        >
          <Settings className="h-4 w-4 flex-shrink-0 text-sidebar-muted" />
          {!isCollapsed && <span>Project settings</span>}
        </Link>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            'w-full mt-1 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 h-8 rounded-sm',
            isCollapsed && 'justify-center'
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-xs">«</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}