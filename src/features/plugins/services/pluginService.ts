import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { Plugin } from '../types';

export async function getPlugins(): Promise<Plugin[]> {
  const { data, error } = await supabase
    .from('plugins')
    .select('*')
    .order('is_system', { ascending: false })
    .order('name');

  if (error) throw error;
  return (data || []) as Plugin[];
}

export async function getPlugin(key: string): Promise<Plugin | null> {
  const { data, error } = await supabase
    .from('plugins')
    .select('*')
    .eq('key', key)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as Plugin | null;
}

export async function getEnabledPlugins(): Promise<Plugin[]> {
  const { data, error } = await supabase
    .from('plugins')
    .select('*')
    .eq('is_enabled', true)
    .order('name');

  if (error) throw error;
  return (data || []) as Plugin[];
}

export async function togglePlugin(id: string, enabled: boolean): Promise<Plugin> {
  const { data, error } = await supabase
    .from('plugins')
    .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Plugin;
}

export async function updatePluginConfig(id: string, config: Record<string, unknown>): Promise<Plugin> {
  const { data, error } = await supabase
    .from('plugins')
    .update({ config: config as Json, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Plugin;
}

export async function createPlugin(plugin: Omit<Plugin, 'id' | 'created_at' | 'updated_at'>): Promise<Plugin> {
  const { data, error } = await supabase
    .from('plugins')
    .insert({
      key: plugin.key,
      name: plugin.name,
      description: plugin.description,
      version: plugin.version,
      vendor: plugin.vendor,
      vendor_url: plugin.vendor_url,
      documentation_url: plugin.documentation_url,
      icon_url: plugin.icon_url,
      category: plugin.category,
      is_system: plugin.is_system,
      is_enabled: plugin.is_enabled,
      config: (plugin.config || {}) as Json,
      hooks: (plugin.hooks || []) as Json,
      permissions: (plugin.permissions || []) as Json,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Plugin;
}
