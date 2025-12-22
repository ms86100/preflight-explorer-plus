import { supabase } from '@/integrations/supabase/client';
import type { LdapConfiguration, LdapGroupMapping, LdapSyncLog, SyncResult } from '../types';

export async function fetchLdapConfigurations(): Promise<LdapConfiguration[]> {
  const { data, error } = await supabase
    .from('ldap_configurations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as LdapConfiguration[];
}

export async function fetchLdapConfiguration(id: string): Promise<LdapConfiguration | null> {
  const { data, error } = await supabase
    .from('ldap_configurations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as LdapConfiguration | null;
}

export async function createLdapConfiguration(config: Partial<LdapConfiguration>): Promise<LdapConfiguration> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('ldap_configurations')
    .insert({
      name: config.name!,
      server_url: config.server_url!,
      base_dn: config.base_dn!,
      bind_dn: config.bind_dn,
      port: config.port,
      use_ssl: config.use_ssl,
      search_filter: config.search_filter,
      group_search_filter: config.group_search_filter,
      group_base_dn: config.group_base_dn,
      user_id_attribute: config.user_id_attribute,
      email_attribute: config.email_attribute,
      display_name_attribute: config.display_name_attribute,
      department_attribute: config.department_attribute,
      group_name_attribute: config.group_name_attribute,
      group_member_attribute: config.group_member_attribute,
      sync_interval_minutes: config.sync_interval_minutes,
      is_active: config.is_active,
    })
    .select()
    .single();

  if (error) throw error;
  return data as LdapConfiguration;
}

export async function updateLdapConfiguration(id: string, updates: Partial<LdapConfiguration>): Promise<LdapConfiguration> {
  const { data, error } = await supabase
    .from('ldap_configurations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as LdapConfiguration;
}

export async function deleteLdapConfiguration(id: string): Promise<void> {
  const { error } = await supabase
    .from('ldap_configurations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchGroupMappings(configId: string): Promise<LdapGroupMapping[]> {
  const { data, error } = await supabase
    .from('ldap_group_mappings')
    .select('*')
    .eq('ldap_config_id', configId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as LdapGroupMapping[];
}

export async function createGroupMapping(mapping: Partial<LdapGroupMapping>): Promise<LdapGroupMapping> {
  const { data, error } = await supabase
    .from('ldap_group_mappings')
    .insert({
      ldap_config_id: mapping.ldap_config_id!,
      ldap_group_dn: mapping.ldap_group_dn!,
      ldap_group_name: mapping.ldap_group_name!,
      target_type: mapping.target_type!,
      target_role: mapping.target_role,
      target_project_role_id: mapping.target_project_role_id,
      target_group_id: mapping.target_group_id,
      is_active: mapping.is_active,
    })
    .select()
    .single();

  if (error) throw error;
  return data as LdapGroupMapping;
}

export async function updateGroupMapping(id: string, updates: Partial<LdapGroupMapping>): Promise<LdapGroupMapping> {
  const { data, error } = await supabase
    .from('ldap_group_mappings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as LdapGroupMapping;
}

export async function deleteGroupMapping(id: string): Promise<void> {
  const { error } = await supabase
    .from('ldap_group_mappings')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchSyncLogs(configId: string, limit = 20): Promise<LdapSyncLog[]> {
  const { data, error } = await supabase
    .from('ldap_sync_logs')
    .select('*')
    .eq('ldap_config_id', configId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as LdapSyncLog[];
}

export async function testLdapConnection(configId: string): Promise<{ success: boolean; message?: string; errors?: string[] }> {
  const { data, error } = await supabase.functions.invoke('ldap-sync', {
    body: { action: 'test_connection', config_id: configId }
  });

  if (error) throw error;
  return data;
}

export async function triggerSync(
  configId: string, 
  ldapData?: { users?: any[]; groups?: any[] }
): Promise<SyncResult> {
  const { data, error } = await supabase.functions.invoke('ldap-sync', {
    body: { 
      action: 'sync_groups', 
      config_id: configId,
      ldap_data: ldapData
    }
  });

  if (error) throw error;
  return data;
}

export async function getSyncStatus(configId: string): Promise<{
  config_status: { last_sync_at: string | null; last_sync_status: string | null; last_sync_error: string | null };
  recent_syncs: LdapSyncLog[];
  cached_users: number;
}> {
  const { data, error } = await supabase.functions.invoke('ldap-sync', {
    body: { action: 'get_sync_status', config_id: configId }
  });

  if (error) throw error;
  return data;
}

export async function fetchGroups(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function fetchProjectRoles(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('project_roles')
    .select('id, name')
    .order('name');

  if (error) throw error;
  return data || [];
}
