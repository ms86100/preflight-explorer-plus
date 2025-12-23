/**
 * @fileoverview Unit tests for ldapService.
 * @module features/ldap/services/ldapService.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-uuid' } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: { success: true }, error: null })),
    },
  },
}));

// ============================================================================
// Type Definitions for Testing
// ============================================================================

/** LDAP configuration */
interface LdapConfiguration {
  id: string;
  name: string;
  server_url: string;
  port: number;
  base_dn: string;
  bind_dn: string | null;
  use_ssl: boolean;
  search_filter: string | null;
  user_id_attribute: string;
  email_attribute: string;
  display_name_attribute: string;
  group_base_dn: string | null;
  group_search_filter: string | null;
  sync_interval_minutes: number;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: 'success' | 'failed' | 'running' | null;
}

/** LDAP group mapping */
interface LdapGroupMapping {
  id: string;
  ldap_config_id: string;
  ldap_group_dn: string;
  ldap_group_name: string;
  target_type: 'role' | 'group' | 'project_role';
  target_role: string | null;
  target_group_id: string | null;
  target_project_role_id: string | null;
  is_active: boolean;
}

/** LDAP sync log entry */
interface LdapSyncLog {
  id: string;
  ldap_config_id: string;
  sync_type: 'full' | 'incremental' | 'manual';
  status: 'success' | 'failed' | 'running';
  started_at: string;
  completed_at: string | null;
  users_synced: number;
  groups_synced: number;
  roles_assigned: number;
  roles_revoked: number;
  errors: unknown[] | null;
}

/** Sync result from edge function */
interface SyncResult {
  success: boolean;
  users_synced?: number;
  groups_synced?: number;
  roles_assigned?: number;
  roles_revoked?: number;
  errors?: string[];
}

// ============================================================================
// Type Tests
// ============================================================================

describe('LDAP Types', () => {
  describe('LdapConfiguration', () => {
    it('should have all required properties', () => {
      const config: LdapConfiguration = {
        id: 'config-uuid',
        name: 'Corporate LDAP',
        server_url: 'ldap://ldap.example.com',
        port: 389,
        base_dn: 'dc=example,dc=com',
        bind_dn: 'cn=admin,dc=example,dc=com',
        use_ssl: false,
        search_filter: '(objectClass=person)',
        user_id_attribute: 'uid',
        email_attribute: 'mail',
        display_name_attribute: 'cn',
        group_base_dn: 'ou=groups,dc=example,dc=com',
        group_search_filter: '(objectClass=groupOfNames)',
        sync_interval_minutes: 60,
        is_active: true,
        last_sync_at: null,
        last_sync_status: null,
      };
      
      expect(config.id).toBeDefined();
      expect(config.server_url).toBe('ldap://ldap.example.com');
    });

    it('should support SSL configuration', () => {
      const config: LdapConfiguration = {
        id: 'config-uuid',
        name: 'Secure LDAP',
        server_url: 'ldaps://ldap.example.com',
        port: 636,
        base_dn: 'dc=example,dc=com',
        bind_dn: null,
        use_ssl: true,
        search_filter: null,
        user_id_attribute: 'sAMAccountName',
        email_attribute: 'userPrincipalName',
        display_name_attribute: 'displayName',
        group_base_dn: null,
        group_search_filter: null,
        sync_interval_minutes: 30,
        is_active: true,
        last_sync_at: '2024-01-15T10:00:00Z',
        last_sync_status: 'success',
      };
      
      expect(config.use_ssl).toBe(true);
      expect(config.port).toBe(636);
    });

    it('should support all sync statuses', () => {
      const statuses: LdapConfiguration['last_sync_status'][] = ['success', 'failed', 'running', null];
      
      statuses.forEach((status) => {
        const config: LdapConfiguration = {
          id: 'config-uuid',
          name: 'Test',
          server_url: 'ldap://test',
          port: 389,
          base_dn: 'dc=test',
          bind_dn: null,
          use_ssl: false,
          search_filter: null,
          user_id_attribute: 'uid',
          email_attribute: 'mail',
          display_name_attribute: 'cn',
          group_base_dn: null,
          group_search_filter: null,
          sync_interval_minutes: 60,
          is_active: true,
          last_sync_at: null,
          last_sync_status: status,
        };
        expect(config.last_sync_status).toBe(status);
      });
    });
  });

  describe('LdapGroupMapping', () => {
    it('should support role target type', () => {
      const mapping: LdapGroupMapping = {
        id: 'mapping-uuid',
        ldap_config_id: 'config-uuid',
        ldap_group_dn: 'cn=admins,ou=groups,dc=example,dc=com',
        ldap_group_name: 'admins',
        target_type: 'role',
        target_role: 'admin',
        target_group_id: null,
        target_project_role_id: null,
        is_active: true,
      };
      
      expect(mapping.target_type).toBe('role');
      expect(mapping.target_role).toBe('admin');
    });

    it('should support group target type', () => {
      const mapping: LdapGroupMapping = {
        id: 'mapping-uuid',
        ldap_config_id: 'config-uuid',
        ldap_group_dn: 'cn=developers,ou=groups,dc=example,dc=com',
        ldap_group_name: 'developers',
        target_type: 'group',
        target_role: null,
        target_group_id: 'group-uuid',
        target_project_role_id: null,
        is_active: true,
      };
      
      expect(mapping.target_type).toBe('group');
      expect(mapping.target_group_id).toBe('group-uuid');
    });

    it('should support project role target type', () => {
      const mapping: LdapGroupMapping = {
        id: 'mapping-uuid',
        ldap_config_id: 'config-uuid',
        ldap_group_dn: 'cn=project-leads,ou=groups,dc=example,dc=com',
        ldap_group_name: 'project-leads',
        target_type: 'project_role',
        target_role: null,
        target_group_id: null,
        target_project_role_id: 'project-role-uuid',
        is_active: true,
      };
      
      expect(mapping.target_type).toBe('project_role');
      expect(mapping.target_project_role_id).toBe('project-role-uuid');
    });
  });

  describe('LdapSyncLog', () => {
    it('should represent successful sync', () => {
      const log: LdapSyncLog = {
        id: 'log-uuid',
        ldap_config_id: 'config-uuid',
        sync_type: 'full',
        status: 'success',
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:05:00Z',
        users_synced: 150,
        groups_synced: 10,
        roles_assigned: 25,
        roles_revoked: 5,
        errors: null,
      };
      
      expect(log.status).toBe('success');
      expect(log.users_synced).toBe(150);
    });

    it('should represent failed sync with errors', () => {
      const log: LdapSyncLog = {
        id: 'log-uuid',
        ldap_config_id: 'config-uuid',
        sync_type: 'manual',
        status: 'failed',
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:01:00Z',
        users_synced: 0,
        groups_synced: 0,
        roles_assigned: 0,
        roles_revoked: 0,
        errors: [
          { message: 'Connection timeout', code: 'ETIMEDOUT' },
        ],
      };
      
      expect(log.status).toBe('failed');
      expect(log.errors).toHaveLength(1);
    });

    it('should support all sync types', () => {
      const syncTypes: LdapSyncLog['sync_type'][] = ['full', 'incremental', 'manual'];
      
      syncTypes.forEach((type) => {
        expect(type).toBeDefined();
      });
    });
  });

  describe('SyncResult', () => {
    it('should represent successful sync result', () => {
      const result: SyncResult = {
        success: true,
        users_synced: 100,
        groups_synced: 5,
        roles_assigned: 20,
        roles_revoked: 3,
      };
      
      expect(result.success).toBe(true);
    });

    it('should represent failed sync result with errors', () => {
      const result: SyncResult = {
        success: false,
        errors: ['Connection refused', 'Invalid credentials'],
      };
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe('LDAP Validation', () => {
  /**
   * Validates LDAP server URL format.
   */
  function validateServerUrl(url: string): { valid: boolean; error?: string } {
    if (!url) {
      return { valid: false, error: 'Server URL is required' };
    }

    const pattern = /^ldaps?:\/\/[a-zA-Z0-9.-]+(:\d+)?$/;
    if (!pattern.test(url)) {
      return { valid: false, error: 'Invalid LDAP URL format. Use ldap:// or ldaps://' };
    }

    return { valid: true };
  }

  describe('validateServerUrl', () => {
    it('should accept valid LDAP URLs', () => {
      expect(validateServerUrl('ldap://ldap.example.com')).toEqual({ valid: true });
      expect(validateServerUrl('ldaps://secure.example.com')).toEqual({ valid: true });
      expect(validateServerUrl('ldap://localhost:389')).toEqual({ valid: true });
    });

    it('should reject invalid URLs', () => {
      expect(validateServerUrl('')).toEqual({
        valid: false,
        error: 'Server URL is required',
      });
      expect(validateServerUrl('http://ldap.example.com')).toEqual({
        valid: false,
        error: 'Invalid LDAP URL format. Use ldap:// or ldaps://',
      });
    });
  });

  /**
   * Validates Distinguished Name format.
   */
  function validateDN(dn: string): { valid: boolean; error?: string } {
    if (!dn) {
      return { valid: false, error: 'Distinguished Name is required' };
    }

    // Basic DN format validation
    const dnPattern = /^([a-zA-Z]+=.+,)*[a-zA-Z]+=.+$/;
    if (!dnPattern.test(dn)) {
      return { valid: false, error: 'Invalid DN format (e.g., cn=admin,dc=example,dc=com)' };
    }

    return { valid: true };
  }

  describe('validateDN', () => {
    it('should accept valid DNs', () => {
      expect(validateDN('dc=example,dc=com')).toEqual({ valid: true });
      expect(validateDN('cn=admin,dc=example,dc=com')).toEqual({ valid: true });
      expect(validateDN('ou=users,dc=corp,dc=example,dc=com')).toEqual({ valid: true });
    });

    it('should reject invalid DNs', () => {
      expect(validateDN('')).toEqual({
        valid: false,
        error: 'Distinguished Name is required',
      });
      expect(validateDN('invalid')).toEqual({
        valid: false,
        error: 'Invalid DN format (e.g., cn=admin,dc=example,dc=com)',
      });
    });
  });

  /**
   * Validates LDAP filter syntax.
   */
  function validateFilter(filter: string): { valid: boolean; error?: string } {
    if (!filter) {
      return { valid: true }; // Filters are optional
    }

    // Basic filter syntax check
    if (!filter.startsWith('(') || !filter.endsWith(')')) {
      return { valid: false, error: 'Filter must be enclosed in parentheses' };
    }

    // Check for balanced parentheses
    let depth = 0;
    for (const char of filter) {
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (depth < 0) {
        return { valid: false, error: 'Unbalanced parentheses in filter' };
      }
    }

    if (depth !== 0) {
      return { valid: false, error: 'Unbalanced parentheses in filter' };
    }

    return { valid: true };
  }

  describe('validateFilter', () => {
    it('should accept valid filters', () => {
      expect(validateFilter('(objectClass=person)')).toEqual({ valid: true });
      expect(validateFilter('(&(objectClass=user)(!(disabled=TRUE)))')).toEqual({ valid: true });
      expect(validateFilter('(|(cn=*admin*)(cn=*manager*))')).toEqual({ valid: true });
    });

    it('should accept empty filter', () => {
      expect(validateFilter('')).toEqual({ valid: true });
    });

    it('should reject invalid filters', () => {
      expect(validateFilter('objectClass=person')).toEqual({
        valid: false,
        error: 'Filter must be enclosed in parentheses',
      });
      expect(validateFilter('((objectClass=person)')).toEqual({
        valid: false,
        error: 'Unbalanced parentheses in filter',
      });
    });
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('LDAP Helpers', () => {
  /**
   * Calculates time since last sync.
   */
  function getTimeSinceSync(lastSyncAt: string | null): string {
    if (!lastSyncAt) return 'Never';

    const now = new Date();
    const syncDate = new Date(lastSyncAt);
    const diffMs = now.getTime() - syncDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  describe('getTimeSinceSync', () => {
    it('should return Never for null', () => {
      expect(getTimeSinceSync(null)).toBe('Never');
    });

    it('should return Just now for recent sync', () => {
      const now = new Date().toISOString();
      expect(getTimeSinceSync(now)).toBe('Just now');
    });

    it('should format minutes correctly', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(getTimeSinceSync(fiveMinAgo)).toBe('5 minutes ago');
    });

    it('should format hours correctly', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(getTimeSinceSync(twoHoursAgo)).toBe('2 hours ago');
    });

    it('should format days correctly', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(getTimeSinceSync(threeDaysAgo)).toBe('3 days ago');
    });
  });

  /**
   * Determines sync health based on configuration and last sync.
   */
  function getSyncHealth(config: LdapConfiguration): 'healthy' | 'warning' | 'error' | 'unknown' {
    if (!config.is_active) return 'unknown';
    if (!config.last_sync_at) return 'warning';
    if (config.last_sync_status === 'failed') return 'error';
    if (config.last_sync_status === 'running') return 'healthy';

    // Check if sync is overdue
    const now = new Date();
    const lastSync = new Date(config.last_sync_at);
    const overdueMs = config.sync_interval_minutes * 60 * 1000 * 2; // 2x interval
    
    if (now.getTime() - lastSync.getTime() > overdueMs) {
      return 'warning';
    }

    return 'healthy';
  }

  describe('getSyncHealth', () => {
    it('should return unknown for inactive config', () => {
      const config: LdapConfiguration = {
        id: '1', name: 'Test', server_url: 'ldap://test', port: 389,
        base_dn: 'dc=test', bind_dn: null, use_ssl: false,
        search_filter: null, user_id_attribute: 'uid',
        email_attribute: 'mail', display_name_attribute: 'cn',
        group_base_dn: null, group_search_filter: null,
        sync_interval_minutes: 60, is_active: false,
        last_sync_at: null, last_sync_status: null,
      };
      expect(getSyncHealth(config)).toBe('unknown');
    });

    it('should return warning for never synced', () => {
      const config: LdapConfiguration = {
        id: '1', name: 'Test', server_url: 'ldap://test', port: 389,
        base_dn: 'dc=test', bind_dn: null, use_ssl: false,
        search_filter: null, user_id_attribute: 'uid',
        email_attribute: 'mail', display_name_attribute: 'cn',
        group_base_dn: null, group_search_filter: null,
        sync_interval_minutes: 60, is_active: true,
        last_sync_at: null, last_sync_status: null,
      };
      expect(getSyncHealth(config)).toBe('warning');
    });

    it('should return error for failed sync', () => {
      const config: LdapConfiguration = {
        id: '1', name: 'Test', server_url: 'ldap://test', port: 389,
        base_dn: 'dc=test', bind_dn: null, use_ssl: false,
        search_filter: null, user_id_attribute: 'uid',
        email_attribute: 'mail', display_name_attribute: 'cn',
        group_base_dn: null, group_search_filter: null,
        sync_interval_minutes: 60, is_active: true,
        last_sync_at: new Date().toISOString(), last_sync_status: 'failed',
      };
      expect(getSyncHealth(config)).toBe('error');
    });

    it('should return healthy for recent successful sync', () => {
      const config: LdapConfiguration = {
        id: '1', name: 'Test', server_url: 'ldap://test', port: 389,
        base_dn: 'dc=test', bind_dn: null, use_ssl: false,
        search_filter: null, user_id_attribute: 'uid',
        email_attribute: 'mail', display_name_attribute: 'cn',
        group_base_dn: null, group_search_filter: null,
        sync_interval_minutes: 60, is_active: true,
        last_sync_at: new Date().toISOString(), last_sync_status: 'success',
      };
      expect(getSyncHealth(config)).toBe('healthy');
    });
  });
});
