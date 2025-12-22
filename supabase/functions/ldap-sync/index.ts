import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LdapConfig {
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
}

interface GroupMapping {
  id: string;
  ldap_group_dn: string;
  ldap_group_name: string;
  target_type: 'app_role' | 'project_role' | 'group';
  target_role: string | null;
  target_project_role_id: string | null;
  target_group_id: string | null;
}

interface SyncResult {
  success: boolean;
  users_synced: number;
  groups_synced: number;
  roles_assigned: number;
  roles_revoked: number;
  errors: Array<{ type: string; message: string; details?: string }>;
}

// Note: In a real implementation, you would use an LDAP library like ldapjs
// Since Deno doesn't have native LDAP support, this would typically:
// 1. Call an external LDAP proxy service
// 2. Use a webhook from your AD/LDAP system
// 3. Process a CSV/JSON export from AD
// This implementation provides the framework for group sync processing

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header for user context
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id || null;
    }

    const { action, config_id, ldap_data } = await req.json();

    console.log(`LDAP Sync action: ${action}, config: ${config_id}`);

    switch (action) {
      case 'test_connection':
        return await testConnection(supabase, config_id);
      
      case 'sync_groups':
        return await syncGroups(supabase, config_id, ldap_data, userId);
      
      case 'process_webhook':
        return await processWebhook(supabase, config_id, ldap_data, userId);
      
      case 'get_sync_status':
        return await getSyncStatus(supabase, config_id);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('LDAP Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function testConnection(supabase: any, configId: string) {
  // Fetch config
  const { data: config, error } = await supabase
    .from('ldap_configurations')
    .select('*')
    .eq('id', configId)
    .single();

  if (error || !config) {
    return new Response(
      JSON.stringify({ success: false, error: 'Configuration not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // In a real implementation, you would attempt to bind to the LDAP server here
  // For now, we validate the configuration format
  const validationErrors: string[] = [];
  
  if (!config.server_url) validationErrors.push('Server URL is required');
  if (!config.base_dn) validationErrors.push('Base DN is required');
  if (config.port < 1 || config.port > 65535) validationErrors.push('Invalid port number');

  if (validationErrors.length > 0) {
    return new Response(
      JSON.stringify({ success: false, errors: validationErrors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Update last test status
  await supabase
    .from('ldap_configurations')
    .update({ 
      last_sync_status: 'connection_test_passed',
      updated_at: new Date().toISOString()
    })
    .eq('id', configId);

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Configuration validated. Ready for LDAP data sync.',
      config_summary: {
        name: config.name,
        server: config.server_url,
        base_dn: config.base_dn,
        ssl: config.use_ssl
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function syncGroups(
  supabase: any, 
  configId: string, 
  ldapData: any,
  triggeredBy: string | null
): Promise<Response> {
  const result: SyncResult = {
    success: true,
    users_synced: 0,
    groups_synced: 0,
    roles_assigned: 0,
    roles_revoked: 0,
    errors: []
  };

  // Create sync log entry
  const { data: syncLog, error: logError } = await supabase
    .from('ldap_sync_logs')
    .insert({
      ldap_config_id: configId,
      sync_type: 'manual',
      status: 'started',
      triggered_by: triggeredBy
    })
    .select()
    .single();

  if (logError) {
    console.error('Failed to create sync log:', logError);
  }

  try {
    // Get group mappings for this config
    const { data: mappings, error: mappingsError } = await supabase
      .from('ldap_group_mappings')
      .select('*')
      .eq('ldap_config_id', configId)
      .eq('is_active', true);

    if (mappingsError) {
      throw new Error('Failed to fetch group mappings');
    }

    if (!mappings || mappings.length === 0) {
      result.errors.push({ type: 'warning', message: 'No group mappings configured' });
    }

    // Process LDAP data if provided
    // Expected format: { users: [...], groups: [...] }
    if (ldapData?.users) {
      for (const ldapUser of ldapData.users) {
        try {
          await processLdapUser(supabase, configId, ldapUser, mappings, result);
          result.users_synced++;
        } catch (err) {
          const errMessage = err instanceof Error ? err.message : 'Unknown error';
          result.errors.push({ 
            type: 'error', 
            message: `Failed to process user: ${ldapUser.email || ldapUser.dn}`,
            details: errMessage
          });
        }
      }
    }

    if (ldapData?.groups) {
      result.groups_synced = ldapData.groups.length;
    }

    // Update sync log
    if (syncLog) {
      await supabase
        .from('ldap_sync_logs')
        .update({
          status: 'completed',
          users_synced: result.users_synced,
          groups_synced: result.groups_synced,
          roles_assigned: result.roles_assigned,
          roles_revoked: result.roles_revoked,
          errors: result.errors,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id);
    }

    // Update config last sync
    await supabase
      .from('ldap_configurations')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: result.errors.length > 0 ? 'completed_with_errors' : 'completed',
        last_sync_error: result.errors.length > 0 ? JSON.stringify(result.errors[0]) : null
      })
      .eq('id', configId);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.success = false;
    result.errors.push({ type: 'error', message: errorMessage });

    if (syncLog) {
      await supabase
        .from('ldap_sync_logs')
        .update({
          status: 'failed',
          errors: result.errors,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id);
    }

    await supabase
      .from('ldap_configurations')
      .update({
        last_sync_status: 'failed',
        last_sync_error: errorMessage
      })
      .eq('id', configId);
  }

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processLdapUser(
  supabase: any,
  configId: string,
  ldapUser: any,
  mappings: GroupMapping[],
  result: SyncResult
) {
  const { email, dn, username, display_name, department, groups = [] } = ldapUser;

  if (!email) {
    throw new Error('User email is required');
  }

  // Find or match user by email
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (!profile) {
    // User doesn't exist in system - cache their LDAP data for when they sign up
    await supabase
      .from('ldap_user_cache')
      .upsert({
        ldap_config_id: configId,
        ldap_dn: dn,
        ldap_username: username || email,
        email,
        display_name,
        department,
        ldap_groups: groups,
        last_synced_at: new Date().toISOString()
      }, { onConflict: 'ldap_config_id,ldap_dn' });
    
    return;
  }

  const userId = profile.id;

  // Update LDAP cache
  await supabase
    .from('ldap_user_cache')
    .upsert({
      ldap_config_id: configId,
      user_id: userId,
      ldap_dn: dn,
      ldap_username: username || email,
      email,
      display_name,
      department,
      ldap_groups: groups,
      last_synced_at: new Date().toISOString()
    }, { onConflict: 'ldap_config_id,ldap_dn' });

  // Apply group mappings
  for (const mapping of mappings) {
    const userInGroup = groups.some((g: any) => 
      g.dn === mapping.ldap_group_dn || 
      g.name === mapping.ldap_group_name ||
      g === mapping.ldap_group_dn ||
      g === mapping.ldap_group_name
    );

    if (mapping.target_type === 'app_role' && mapping.target_role) {
      if (userInGroup) {
        // Add role if not exists
        const { error } = await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: mapping.target_role }, { onConflict: 'user_id,role' });
        
        if (!error) result.roles_assigned++;
      } else {
        // Optionally revoke role if user no longer in group
        // Uncomment below to enable role revocation
        /*
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', mapping.target_role);
        
        if (!error) result.roles_revoked++;
        */
      }
    }

    if (mapping.target_type === 'group' && mapping.target_group_id) {
      if (userInGroup) {
        await supabase
          .from('group_memberships')
          .upsert({ 
            user_id: userId, 
            group_id: mapping.target_group_id 
          }, { onConflict: 'user_id,group_id' });
        
        result.roles_assigned++;
      }
    }
  }
}

async function processWebhook(
  supabase: any,
  configId: string,
  webhookData: any,
  triggeredBy: string | null
): Promise<Response> {
  // Process webhook from AD/LDAP system (e.g., Azure AD, Okta SCIM)
  console.log('Processing webhook for config:', configId);

  // Create sync log
  const { data: syncLog } = await supabase
    .from('ldap_sync_logs')
    .insert({
      ldap_config_id: configId,
      sync_type: 'webhook',
      status: 'started',
      triggered_by: triggeredBy
    })
    .select()
    .single();

  try {
    // Transform webhook data to our format
    const ldapData = transformWebhookData(webhookData);
    
    // Get mappings
    const { data: mappings } = await supabase
      .from('ldap_group_mappings')
      .select('*')
      .eq('ldap_config_id', configId)
      .eq('is_active', true);

    const result: SyncResult = {
      success: true,
      users_synced: 0,
      groups_synced: 0,
      roles_assigned: 0,
      roles_revoked: 0,
      errors: []
    };

    if (ldapData.users) {
      for (const user of ldapData.users) {
        try {
          await processLdapUser(supabase, configId, user, mappings || [], result);
          result.users_synced++;
        } catch (err) {
          const errMessage = err instanceof Error ? err.message : 'Unknown error';
          result.errors.push({ type: 'error', message: errMessage });
        }
      }
    }

    // Update sync log
    if (syncLog) {
      await supabase
        .from('ldap_sync_logs')
        .update({
          status: 'completed',
          users_synced: result.users_synced,
          roles_assigned: result.roles_assigned,
          errors: result.errors,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (syncLog) {
      await supabase
        .from('ldap_sync_logs')
        .update({
          status: 'failed',
          errors: [{ type: 'error', message: errorMessage }],
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id);
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function transformWebhookData(webhookData: any): { users: any[], groups: any[] } {
  // Handle different webhook formats (Azure AD, Okta SCIM, etc.)
  // This is a basic transformer - extend based on your IdP
  
  if (webhookData.schemas?.includes('urn:ietf:params:scim:api:messages:2.0:ListResponse')) {
    // SCIM format
    return {
      users: webhookData.Resources?.map((r: any) => ({
        email: r.emails?.[0]?.value || r.userName,
        dn: r.id,
        username: r.userName,
        display_name: r.displayName,
        department: r['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User']?.department,
        groups: r.groups?.map((g: any) => g.display || g.value) || []
      })) || [],
      groups: []
    };
  }

  // Default format (our custom format)
  return {
    users: webhookData.users || [],
    groups: webhookData.groups || []
  };
}

async function getSyncStatus(supabase: any, configId: string): Promise<Response> {
  // Get config status
  const { data: config } = await supabase
    .from('ldap_configurations')
    .select('last_sync_at, last_sync_status, last_sync_error')
    .eq('id', configId)
    .single();

  // Get recent sync logs
  const { data: recentLogs } = await supabase
    .from('ldap_sync_logs')
    .select('*')
    .eq('ldap_config_id', configId)
    .order('started_at', { ascending: false })
    .limit(10);

  // Get cached user count
  const { count: cachedUsers } = await supabase
    .from('ldap_user_cache')
    .select('*', { count: 'exact', head: true })
    .eq('ldap_config_id', configId);

  return new Response(
    JSON.stringify({
      config_status: config,
      recent_syncs: recentLogs || [],
      cached_users: cachedUsers || 0
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
