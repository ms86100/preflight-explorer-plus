// Git Demo Mode Context
// Provides demo mode state and controls for testing Git integration

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GitDemoContextValue {
  isDemoMode: boolean;
  isLoading: boolean;
  enableDemoMode: () => Promise<void>;
  disableDemoMode: () => Promise<void>;
  toggleDemoMode: () => Promise<void>;
}

const GitDemoContext = createContext<GitDemoContextValue | undefined>(undefined);

export function GitDemoProvider({ children }: { readonly children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const enableDemoMode = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('git-demo-seed', {
        body: { action: 'seed' },
      });

      if (error) throw error;

      setIsDemoMode(true);
      toast.success('Demo mode enabled', {
        description: `Created ${data.data?.commits || 0} commits, ${data.data?.branches || 0} branches, ${data.data?.pull_requests || 0} PRs`,
      });
    } catch (error) {
      console.error('Failed to enable demo mode:', error);
      toast.error('Failed to enable demo mode');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disableDemoMode = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('git-demo-seed', {
        body: { action: 'cleanup' },
      });

      if (error) throw error;

      setIsDemoMode(false);
      toast.success('Demo mode disabled', {
        description: 'All demo data has been removed',
      });
    } catch (error) {
      console.error('Failed to disable demo mode:', error);
      toast.error('Failed to disable demo mode');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleDemoMode = useCallback(async () => {
    if (isDemoMode) {
      await disableDemoMode();
    } else {
      await enableDemoMode();
    }
  }, [isDemoMode, enableDemoMode, disableDemoMode]);

  const contextValue = useMemo(() => ({
    isDemoMode,
    isLoading,
    enableDemoMode,
    disableDemoMode,
    toggleDemoMode,
  }), [isDemoMode, isLoading, enableDemoMode, disableDemoMode, toggleDemoMode]);

  return (
    <GitDemoContext.Provider value={contextValue}>
      {children}
    </GitDemoContext.Provider>
  );
}

export function useGitDemo() {
  const context = useContext(GitDemoContext);
  if (!context) {
    throw new Error('useGitDemo must be used within a GitDemoProvider');
  }
  return context;
}
