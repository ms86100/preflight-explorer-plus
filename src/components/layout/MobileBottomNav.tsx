import { Link, useLocation } from 'react-router-dom';
import { Home, FolderKanban, ListChecks, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Issues', href: '/issues', icon: ListChecks },
  { label: 'Search', href: '/issues?search=1', icon: Search },
  { label: 'Profile', href: '/profile', icon: User },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Don't show on auth page
  if (location.pathname === '/auth') return null;

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href.split('?')[0]);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border lg:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          // Redirect to auth if not authenticated and clicking profile
          const href = item.href === '/profile' && !isAuthenticated ? '/auth' : item.href;
          
          return (
            <Link
              key={item.label}
              to={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-lg transition-all active:scale-95',
                active 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-7 rounded-full transition-colors',
                active && 'bg-primary/10'
              )}>
                <item.icon className={cn('h-5 w-5', active && 'stroke-[2.5px]')} />
              </div>
              <span className={cn(
                'text-[10px] font-medium',
                active && 'font-semibold'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
