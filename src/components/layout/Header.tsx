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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const NAV_ITEMS = [
  {
    label: 'Dashboards',
    href: '/dashboards',
    items: [
      { label: 'System Dashboard', href: '/dashboards/system' },
      { label: 'Create Dashboard', href: '/dashboards/create' },
    ],
  },
  {
    label: 'Projects',
    href: '/projects',
    items: [
      { label: 'View all projects', href: '/projects' },
      { label: 'Create Project', href: '/projects/create' },
    ],
  },
  {
    label: 'Issues',
    href: '/issues',
    items: [
      { label: 'Search Issues', href: '/issues' },
      { label: 'My Open Issues', href: '/issues?filter=my-open' },
      { label: 'Reported by me', href: '/issues?filter=reported-by-me' },
    ],
  },
  {
    label: 'Boards',
    href: '/boards',
    items: [
      { label: 'View all boards', href: '/boards' },
    ],
  },
  {
    label: 'Plans',
    href: '/plans',
    items: [
      { label: 'Roadmaps', href: '/plans/roadmaps' },
      { label: 'Dependencies', href: '/plans/dependencies' },
    ],
  },
];

const ADMIN_ITEMS = [
  { label: 'Workflows', href: '/workflows', icon: Workflow },
  { label: 'Custom Fields', href: '/custom-fields', icon: Settings },
  { label: 'Plugins', href: '/plugins', icon: Puzzle },
  { label: 'Automation', href: '/automation', icon: Zap },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Data Migration', href: '/migration', icon: Upload },
  { label: 'Admin', href: '/admin', icon: Shield },
];

export function Header() {
  const { user, profile, signOut, isAuthenticated } = useAuth();
  const location = useLocation();

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
    <header className="h-14 bg-gradient-to-b from-[hsl(212,80%,38%)] to-[hsl(212,80%,32%)] text-white flex items-center px-4 gap-2 shadow-md">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 font-semibold text-base mr-4">
        <div className="flex items-center justify-center">
          <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
            <path d="M15.9 3L4 28h6l3-6.5h10l3 6.5h6L20.1 3h-4.2z" fill="currentColor" opacity="0.9"/>
            <path d="M13 17.5L16 10l3 7.5H13z" fill="currentColor"/>
          </svg>
        </div>
        <span className="hidden md:inline font-medium">Jira Software</span>
      </Link>

      {/* Main Navigation */}
      <nav className="flex items-center">
        {NAV_ITEMS.map((item) => (
          <DropdownMenu key={item.label}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'text-white/90 hover:text-white hover:bg-white/10 gap-0.5 h-8 px-2 font-normal text-sm rounded-sm',
                  location.pathname.startsWith(item.href) && 'bg-white/10'
                )}
              >
                {item.label}
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-sm shadow-lg">
              {item.items?.map((subItem) => (
                <DropdownMenuItem key={subItem.href} asChild className="text-sm">
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
              className="text-white/90 hover:text-white hover:bg-white/10 gap-0.5 h-8 px-2 font-normal text-sm rounded-sm"
            >
              Settings
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-sm shadow-lg">
            {ADMIN_ITEMS.map((item) => (
              <DropdownMenuItem key={item.href} asChild className="text-sm">
                <Link to={item.href} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Create Button */}
        <Button
          asChild
          size="sm"
          className="bg-[hsl(212,80%,50%)] hover:bg-[hsl(212,80%,55%)] text-white ml-1 h-8 px-3 text-sm font-medium rounded-sm shadow-sm"
        >
          <Link to={createHref}>Create</Link>
        </Button>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative w-52 hidden lg:block">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
        <Input
          type="search"
          placeholder="Search"
          className="pl-9 h-8 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/30 rounded-sm text-sm"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-0.5">
        <NotificationBell />
        <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8 rounded-sm">
          <HelpCircle className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8 rounded-sm" asChild>
          <Link to="/admin">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>

        {/* User Menu */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 ml-1">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-white/20 text-white text-xs font-medium">
                    {getInitials(profile?.display_name || user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-sm">
              <div className="px-3 py-2">
                <p className="font-medium text-sm">{profile?.display_name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-sm">
                <Link to="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-sm">
                <Link to="/settings">Personal Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive text-sm">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8 rounded-sm">
            <Link to="/auth">Sign In</Link>
          </Button>
        )}
      </div>
    </header>
  );
}