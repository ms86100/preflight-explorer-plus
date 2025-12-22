import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthConfig {
  provider: 'github' | 'gitlab' | 'bitbucket';
  host_url: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

interface OAuthCallbackParams {
  code: string;
  state: string;
  provider: string;
}

// OAuth endpoints for each provider
const OAUTH_ENDPOINTS = {
  github: {
    authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    scopes: 'repo read:org read:user',
  },
  gitlab: {
    authorize: '/oauth/authorize',
    token: '/oauth/token',
    scopes: 'api read_api read_user read_repository',
  },
  bitbucket: {
    authorize: 'https://bitbucket.org/site/oauth2/authorize',
    token: 'https://bitbucket.org/site/oauth2/access_token',
    scopes: 'repository pullrequest pipeline',
  },
};

// Generate OAuth authorization URL
function generateAuthUrl(config: OAuthConfig, state: string): string {
  const endpoints = OAUTH_ENDPOINTS[config.provider];
  const baseUrl = config.provider === 'gitlab' ? config.host_url : '';
  const authorizeUrl = baseUrl + endpoints.authorize;

  const params = new URLSearchParams();
  params.set('client_id', config.client_id);
  params.set('redirect_uri', config.redirect_uri);
  params.set('state', state);

  if (config.provider === 'github') {
    params.set('scope', endpoints.scopes);
  } else if (config.provider === 'gitlab') {
    params.set('response_type', 'code');
    params.set('scope', endpoints.scopes);
  } else if (config.provider === 'bitbucket') {
    params.set('response_type', 'code');
  }

  return `${authorizeUrl}?${params.toString()}`;
}

// Exchange authorization code for access token
async function exchangeCodeForToken(
  config: OAuthConfig,
  code: string
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
  const endpoints = OAUTH_ENDPOINTS[config.provider];
  const baseUrl = config.provider === 'gitlab' ? config.host_url : '';
  const tokenUrl = baseUrl + endpoints.token;

  const params = new URLSearchParams();
  params.set('client_id', config.client_id);
  params.set('client_secret', config.client_secret);
  params.set('code', code);
  params.set('redirect_uri', config.redirect_uri);

  if (config.provider === 'github') {
    // GitHub doesn't require grant_type
  } else {
    params.set('grant_type', 'authorization_code');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (config.provider === 'github') {
    headers['Accept'] = 'application/json';
  }

  console.log(`[git-oauth] Exchanging code for token with ${config.provider}`);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers,
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[git-oauth] Token exchange failed:`, errorText);
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    console.error(`[git-oauth] OAuth error:`, data.error_description || data.error);
    throw new Error(data.error_description || data.error);
  }

  console.log(`[git-oauth] Token exchange successful for ${config.provider}`);

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

// Validate access token and get user info
async function validateToken(
  provider: string,
  hostUrl: string,
  accessToken: string
): Promise<{ valid: boolean; username?: string; email?: string }> {
  try {
    let userUrl: string;
    const headers: Record<string, string> = {};

    if (provider === 'github') {
      userUrl = 'https://api.github.com/user';
      headers['Authorization'] = `Bearer ${accessToken}`;
      headers['Accept'] = 'application/vnd.github+json';
    } else if (provider === 'gitlab') {
      userUrl = `${hostUrl}/api/v4/user`;
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (provider === 'bitbucket') {
      userUrl = 'https://api.bitbucket.org/2.0/user';
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else {
      return { valid: false };
    }

    const response = await fetch(userUrl, { headers });

    if (!response.ok) {
      console.error(`[git-oauth] Token validation failed: ${response.status}`);
      return { valid: false };
    }

    const userData = await response.json();

    return {
      valid: true,
      username: userData.login || userData.username || userData.display_name,
      email: userData.email,
    };
  } catch (error) {
    console.error(`[git-oauth] Token validation error:`, error);
    return { valid: false };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    // POST /git-oauth/initiate - Start OAuth flow
    if (req.method === 'POST' && action === 'initiate') {
      const { organization_id, provider, host_url, client_id, redirect_uri } = await req.json();

      console.log(`[git-oauth] Initiating OAuth for ${provider}`);

      // Generate state token for CSRF protection
      const state = crypto.randomUUID();

      // Store state temporarily (expires in 10 minutes)
      const { error: storeError } = await supabase
        .from('git_oauth_states')
        .insert({
          state,
          organization_id,
          provider,
          host_url,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });

      if (storeError) {
        console.error(`[git-oauth] Failed to store state:`, storeError);
        throw new Error('Failed to initiate OAuth');
      }

      const authUrl = generateAuthUrl(
        { provider, host_url, client_id, client_secret: '', redirect_uri },
        state
      );

      return new Response(
        JSON.stringify({ auth_url: authUrl, state }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /git-oauth/callback - Handle OAuth callback
    if (req.method === 'POST' && action === 'callback') {
      const { code, state, client_id, client_secret, redirect_uri } = await req.json();

      console.log(`[git-oauth] Processing OAuth callback`);

      // Verify state
      const { data: stateData, error: stateError } = await supabase
        .from('git_oauth_states')
        .select('*')
        .eq('state', state)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (stateError || !stateData) {
        console.error(`[git-oauth] Invalid or expired state`);
        return new Response(
          JSON.stringify({ error: 'Invalid or expired state' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete used state
      await supabase.from('git_oauth_states').delete().eq('state', state);

      // Exchange code for token
      const tokenResult = await exchangeCodeForToken(
        {
          provider: stateData.provider,
          host_url: stateData.host_url,
          client_id,
          client_secret,
          redirect_uri,
        },
        code
      );

      // Validate token
      const validation = await validateToken(
        stateData.provider,
        stateData.host_url,
        tokenResult.access_token
      );

      if (!validation.valid) {
        return new Response(
          JSON.stringify({ error: 'Token validation failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update organization with access token
      const { error: updateError } = await supabase
        .from('git_organizations')
        .update({
          access_token_encrypted: tokenResult.access_token,
          oauth_client_id: client_id,
          oauth_client_secret_encrypted: client_secret,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stateData.organization_id);

      if (updateError) {
        console.error(`[git-oauth] Failed to update organization:`, updateError);
        throw new Error('Failed to save credentials');
      }

      console.log(`[git-oauth] OAuth completed successfully for organization ${stateData.organization_id}`);

      return new Response(
        JSON.stringify({
          success: true,
          organization_id: stateData.organization_id,
          username: validation.username,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /git-oauth/validate - Validate existing token
    if (req.method === 'POST' && action === 'validate') {
      const { provider, host_url, access_token } = await req.json();

      const validation = await validateToken(provider, host_url, access_token);

      return new Response(
        JSON.stringify(validation),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error(`[git-oauth] Error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
