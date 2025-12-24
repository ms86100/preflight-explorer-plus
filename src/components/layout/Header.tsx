import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  HelpCircle,
  Settings,
  ChevronDown,
  Workflow,
  Puzzle,
  Zap,
  BarChart3,
  Shield,
  Upload,
  Users,
  FileText,
  Grid3X3,
  Navigation,
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Layers,
  Calendar,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePluginContext } from '@/features/plugins/context/PluginContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useState } from 'react';

// Original terminology - legally distinct naming
const NAV_ITEMS = [
  {
    label: 'Workspace',
    href: '/dashboards',
    icon: LayoutDashboard,
    items: [
      { label: 'Overview', href: '/dashboards/system' },
      { label: 'Create Workspace', href: '/dashboards/create' },
    ],
  },
  {
    label: 'Programs',
    href: '/projects',
    icon: FolderKanban,
    items: [
      { label: 'All Programs', href: '/projects' },
      { label: 'Create Program', href: '/projects/create' },
    ],
  },
  {
    label: 'Work Items',
    href: '/issues',
    icon: ListChecks,
    items: [
      { label: 'Search Work Items', href: '/issues' },
      { label: 'My Active Items', href: '/issues?filter=my-open' },
      { label: 'Reported by Me', href: '/issues?filter=reported-by-me' },
    ],
  },
  {
    label: 'Planner',
    href: '/boards',
    icon: Layers,
    items: [
      { label: 'All Planners', href: '/boards' },
    ],
  },
  {
    label: 'Roadmap',
    href: '/plans',
    icon: Calendar,
    items: [
      { label: 'Timeline View', href: '/plans/roadmaps' },
      { label: 'Dependencies', href: '/plans/dependencies' },
    ],
  },
];

const ADMIN_ITEMS = [
  { label: 'Lifecycles', href: '/workflows', icon: Workflow },
  { label: 'Custom Fields', href: '/custom-fields', icon: Settings },
  { label: 'Extensions', href: '/plugins', icon: Puzzle },
  { label: 'Automation Hub', href: '/automation', icon: Zap },
  { label: 'Insights', href: '/reports', icon: BarChart3 },
  { label: 'Data Import', href: '/migration', icon: Upload },
  { label: 'Directory Sync', href: '/ldap', icon: Users },
  { label: 'Administration', href: '/admin', icon: Shield },
];

const PLUGIN_FEATURE_ITEMS = [
  { label: 'Document Composer', href: '/plugin-features?tab=document-composer', icon: FileText, feature: 'document-composer' },
  { label: 'Structured Data', href: '/plugin-features?tab=structured-data', icon: Grid3X3, feature: 'structured-data-blocks' },
  { label: 'Guided Operations', href: '/plugin-features?tab=guided-operations', icon: Navigation, feature: 'guided-operations' },
];

export function Header() {
  const { user, profile, signOut, isAuthenticated } = useAuth();
  const location = useLocation();
  const { isFeatureEnabled, isLoading: pluginsLoading } = usePluginContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const projectKeyFromPath = (() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'projects' || !parts[1]) return undefined;
    return parts[1];
  })();

  const createHref = projectKeyFromPath
    ? `/projects/${projectKeyFromPath}/issues?create=1`
    : '/issues?create=1';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-[60px] bg-gradient-to-r from-header to-[hsl(222,47%,12%)] text-header-foreground flex items-center px-4 gap-3 shadow-lg relative z-50">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 font-semibold text-base mr-2">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-glow">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="hidden lg:flex flex-col">
          <span className="font-bold tracking-tight text-white">Vertex</span>
          <span className="text-[10px] text-white/60 -mt-0.5 tracking-wide">WORK PLATFORM</span>
        </div>
      </Link>

      {/* Mobile Menu Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-white/80 hover:text-white hover:bg-white/10"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Main Navigation - Desktop */}
      <nav className="hidden lg:flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <DropdownMenu key={item.label}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'text-white/80 hover:text-white hover:bg-white/10 gap-1 h-9 px-3 font-medium text-sm rounded-lg transition-all',
                  location.pathname.startsWith(item.href) && 'bg-white/10 text-white'
                )}
              >
                <item.icon className="h-4 w-4 opacity-70" />
                {item.label}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-lg shadow-xl border-border/50">
              {item.items?.map((subItem) => (
                <DropdownMenuItem key={subItem.href} asChild className="text-sm rounded-md">
                  <Link to={subItem.href}>{subItem.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}

        {/* Settings/Admin Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10 gap-1 h-9 px-3 font-medium text-sm rounded-lg"
            >
              <Settings className="h-4 w-4 opacity-70" />
              Configure
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60 rounded-lg shadow-xl border-border/50">
            {ADMIN_ITEMS.map((item) => (
              <DropdownMenuItem key={item.href} asChild className="text-sm rounded-md">
                <Link to={item.href} className="flex items-center gap-2.5">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
            {!pluginsLoading && PLUGIN_FEATURE_ITEMS.some(item => isFeatureEnabled(item.feature)) && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Extensions
                </div>
                {PLUGIN_FEATURE_ITEMS.map((item) => (
                  isFeatureEnabled(item.feature) && (
                    <DropdownMenuItem key={item.href} asChild className="text-sm rounded-md">
                      <Link to={item.href} className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  )
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Create Button */}
        <Button
          asChild
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground ml-2 h-9 px-4 text-sm font-semibold rounded-lg shadow-glow transition-all hover:shadow-glow-lg"
        >
          <Link to={createHref}>+ New Item</Link>
        </Button>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        <NotificationBell />
        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 h-9 w-9 rounded-lg" asChild>
          <Link to="/admin">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>

        {/* User Menu */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 ml-1 ring-2 ring-white/20 hover:ring-primary/50 transition-all">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url} alt={`${profile?.display_name || 'User'} avatar`} />
                  <AvatarFallback className="bg-primary/80 text-primary-foreground text-xs font-semibold">
                    {getInitials(profile?.display_name || user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-lg shadow-xl">
              <div className="px-3 py-3 bg-muted/30 rounded-t-lg">
                <p className="font-semibold text-sm">{profile?.display_name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-sm rounded-md">
                <Link to="/profile">Profile Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-sm rounded-md">
                <Link to="/settings">Preferences</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive text-sm rounded-md">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10 h-9 rounded-lg ml-1">
            <Link to="/auth">Sign In</Link>
          </Button>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-header border-t border-white/10 shadow-2xl lg:hidden animate-fade-in">
          <nav className="p-4 space-y-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5 opacity-70" />
                {item.label}
              </Link>
            ))}
            <div className="border-t border-white/10 pt-2 mt-2">
              <Link
                to={createHref}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                + New Work Item
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
