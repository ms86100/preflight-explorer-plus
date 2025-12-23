import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useEnabledPlugins } from '../hooks/usePlugins';
import { FEATURE_PLUGIN_MAP, type Plugin, type PluginKey } from '../types';

interface PluginContextValue {
  plugins: Plugin[];
  enabledPluginKeys: Set<PluginKey>;
  isPluginEnabled: (key: PluginKey) => boolean;
  isFeatureEnabled: (featureKey: string) => boolean;
  isLoading: boolean;
  error: Error | null;
}

const PluginContext = createContext<PluginContextValue | undefined>(undefined);

export function PluginProvider({ children }: { readonly children: ReactNode }) {
  const { data: plugins = [], isLoading, error } = useEnabledPlugins();

  const enabledPluginKeys = useMemo(() => {
    return new Set(plugins.map((p) => p.key as PluginKey));
  }, [plugins]);

  const isPluginEnabled = (key: PluginKey): boolean => {
    return enabledPluginKeys.has(key);
  };

  const isFeatureEnabled = (featureKey: string): boolean => {
    const requiredPlugins = FEATURE_PLUGIN_MAP[featureKey];
    if (!requiredPlugins || requiredPlugins.length === 0) {
      // Feature not mapped to any plugin, assume enabled
      return true;
    }
    // Feature is enabled if at least one of its required plugins is enabled
    return requiredPlugins.some((pluginKey) => enabledPluginKeys.has(pluginKey));
  };

  const value: PluginContextValue = {
    plugins,
    enabledPluginKeys,
    isPluginEnabled,
    isFeatureEnabled,
    isLoading,
    error: error as Error | null,
  };

  return (
    <PluginContext.Provider value={value}>
      {children}
    </PluginContext.Provider>
  );
}

export function usePluginContext() {
  const context = useContext(PluginContext);
  if (context === undefined) {
    throw new Error('usePluginContext must be used within a PluginProvider');
  }
  return context;
}

// Convenience hooks
export function useIsFeatureEnabled(featureKey: string): boolean {
  const { isFeatureEnabled, isLoading } = usePluginContext();
  // During loading, assume features are enabled to prevent flash
  if (isLoading) return true;
  return isFeatureEnabled(featureKey);
}

export function useIsPluginEnabled(pluginKey: PluginKey): boolean {
  const { isPluginEnabled, isLoading } = usePluginContext();
  if (isLoading) return true;
  return isPluginEnabled(pluginKey);
}
