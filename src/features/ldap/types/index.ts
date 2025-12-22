export interface LdapConfiguration {
  id: string;
  name: string;
  server_url: string;
  base_dn: string;
  bind_dn: string | null;
  port: number;
  use_ssl: boolean;
  search_filter: string;
  group_search_filter: string;
  group_base_dn: string | null;
  user_id_attribute: string;
  email_attribute: string;
  display_name_attribute: string;
  department_attribute: string;
  group_name_attribute: string;
  group_member_attribute: string;
  is_active: boolean;
  sync_interval_minutes: number;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface LdapGroupMapping {
  id: string;
  ldap_config_id: string;
  ldap_group_dn: string;
  ldap_group_name: string;
  target_type: 'app_role' | 'project_role' | 'group';
  target_role: 'admin' | 'project_admin' | 'developer' | 'viewer' | null;
  target_project_role_id: string | null;
  target_group_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LdapSyncLog {
  id: string;
  ldap_config_id: string;
  sync_type: 'manual' | 'scheduled' | 'webhook';
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  users_synced: number;
  groups_synced: number;
  roles_assigned: number;
  roles_revoked: number;
  errors: Array<{ type: string; message: string; details?: string }>;
  started_at: string;
  completed_at: string | null;
  triggered_by: string | null;
}

export interface LdapUserCache {
  id: string;
  ldap_config_id: string;
  user_id: string | null;
  ldap_dn: string;
  ldap_username: string;
  email: string | null;
  display_name: string | null;
  department: string | null;
  ldap_groups: string[];
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface SyncResult {
  success: boolean;
  users_synced: number;
  groups_synced: number;
  roles_assigned: number;
  roles_revoked: number;
  errors: Array<{ type: string; message: string; details?: string }>;
}

export const APP_ROLES = [
  { value: 'admin', label: 'Administrator', description: 'Full system access' },
  { value: 'project_admin', label: 'Project Admin', description: 'Project management access' },
  { value: 'developer', label: 'Developer', description: 'Standard user access' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
] as const;

export const DEFAULT_LDAP_CONFIG: Partial<LdapConfiguration> = {
  port: 389,
  use_ssl: false,
  search_filter: '(objectClass=user)',
  group_search_filter: '(objectClass=group)',
  user_id_attribute: 'sAMAccountName',
  email_attribute: 'mail',
  display_name_attribute: 'displayName',
  department_attribute: 'department',
  group_name_attribute: 'cn',
  group_member_attribute: 'member',
  sync_interval_minutes: 60,
  is_active: true,
};
