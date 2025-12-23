import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as pluginService from '../services/pluginService';
import type { PluginKey } from '../types';

export function usePlugins() {
  return useQuery({
    queryKey: ['plugins'],
    queryFn: pluginService.getPlugins,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePlugin(key: PluginKey) {
  return useQuery({
    queryKey: ['plugin', key],
    queryFn: () => pluginService.getPlugin(key),
    enabled: !!key,
  });
}

export function useEnabledPlugins() {
  return useQuery({
    queryKey: ['plugins', 'enabled'],
    queryFn: pluginService.getEnabledPlugins,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTogglePlugin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      pluginService.togglePlugin(id, enabled),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
      toast.success(`${data.name} ${data.is_enabled ? 'enabled' : 'disabled'}`);
    },
    onError: (error: Error) => {
      toast.error('Failed to update plugin: ' + error.message);
    },
  });
}

export function useUpdatePluginConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, config }: { id: string; config: Record<string, unknown> }) =>
      pluginService.updatePluginConfig(id, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
      toast.success('Plugin configuration updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update plugin configuration: ' + error.message);
    },
  });
}

export function useCreatePlugin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pluginService.createPlugin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
      toast.success('Plugin created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create plugin: ' + error.message);
    },
  });
}
