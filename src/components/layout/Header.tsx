import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  HelpCircle,
  Settings,
  ChevronDown,
  Plus,
  Grid3X3,
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  BarChart3,
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

const NAV_ITEMS = [
  {
    label: 'Dashboards',
    href: '/dashboards',
    icon: LayoutDashboard,
    items: [
      { label: 'System Dashboard', href: '/dashboards/system' },
      { label: 'Create Dashboard', href: '/dashboards/create' },
    ],
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: FolderKanban,
    items: [
      { label: 'View all projects', href: '/projects' },
      { label: 'Create Project', href: '/projects/create' },
    ],
  },
  {
    label: 'Issues',
    href: '/issues',
    icon: ListTodo,
    items: [
      { label: 'Search Issues', href: '/issues' },
      { label: 'My Open Issues', href: '/issues?filter=my-open' },
      { label: 'Reported by me', href: '/issues?filter=reported-by-me' },
    ],
  },
  {
    label: 'Boards',
    href: '/boards',
    icon: Grid3X3,
    items: [
      { label: 'View all boards', href: '/boards' },
    ],
  },
  {
    label: 'Plans',
    href: '/plans',
    icon: BarChart3,
    items: [
      { label: 'Roadmaps', href: '/plans/roadmaps' },
      { label: 'Dependencies', href: '/plans/dependencies' },
    ],
  },
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
    <header className="h-14 bg-header text-header-foreground flex items-center px-4 gap-4 border-b border-header/20">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
        <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
          <span className="text-white font-bold">J</span>
        </div>
        <span className="hidden md:inline">Jira Software</span>
      </Link>

      {/* Main Navigation */}
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <DropdownMenu key={item.label}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'text-header-foreground/90 hover:text-header-foreground hover:bg-white/10 gap-1',
                  location.pathname.startsWith(item.href) && 'bg-white/10'
                )}
              >
                {item.label}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {item.items?.map((subItem) => (
                <DropdownMenuItem key={subItem.href} asChild>
                  <Link to={subItem.href}>{subItem.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}

        {/* Create Button */}
        <Button
          asChild
          size="sm"
          className="bg-white/20 hover:bg-white/30 text-header-foreground ml-2"
        >
          <Link to={createHref}>Create</Link>
        </Button>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative w-64 hidden lg:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-header-foreground/60" />
        <Input
          type="search"
          placeholder="Search"
          className="pl-10 bg-white/10 border-white/20 text-header-foreground placeholder:text-header-foreground/60 focus:bg-white/20"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-header-foreground/90 hover:text-header-foreground hover:bg-white/10">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-header-foreground/90 hover:text-header-foreground hover:bg-white/10">
          <HelpCircle className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-header-foreground/90 hover:text-header-foreground hover:bg-white/10">
          <Settings className="h-5 w-5" />
        </Button>

        {/* User Menu */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-white/20 text-header-foreground text-sm">
                    {getInitials(profile?.display_name || user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="font-medium">{profile?.display_name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">Personal Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild variant="ghost" className="text-header-foreground hover:bg-white/10">
            <Link to="/auth">Sign In</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
