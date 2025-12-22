import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for OAuth errors
      if (error) {
        setStatus('error');
        setErrorMessage(errorDescription || error);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setErrorMessage('Missing authorization code or state');
        return;
      }

      // Get stored OAuth params
      const storedParams = sessionStorage.getItem('git_oauth_params');
      if (!storedParams) {
        setStatus('error');
        setErrorMessage('OAuth session expired. Please try again.');
        return;
      }

      const params = JSON.parse(storedParams);

      // Verify state matches
      if (params.state !== state) {
        setStatus('error');
        setErrorMessage('Invalid state parameter. Possible CSRF attack.');
        sessionStorage.removeItem('git_oauth_params');
        return;
      }

      try {
        // Exchange code for token
        const { data, error: callbackError } = await supabase.functions.invoke('git-oauth/callback', {
          body: {
            code,
            state,
            client_id: params.client_id,
            client_secret: params.client_secret,
            redirect_uri: params.redirect_uri,
          },
        });

        if (callbackError) {
          throw new Error(callbackError.message || 'Failed to complete OAuth');
        }

        if (data.error) {
          throw new Error(data.error);
        }

        setUsername(data.username || 'Connected');
        setStatus('success');
        sessionStorage.removeItem('git_oauth_params');
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to complete OAuth');
        sessionStorage.removeItem('git_oauth_params');
      }
    };

    processCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            {status === 'processing' && 'Connecting Git Provider'}
            {status === 'success' && 'Connection Successful'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Please wait while we complete the authentication...'}
            {status === 'success' && `Successfully connected as ${username}`}
            {status === 'error' && 'There was a problem connecting your Git provider.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'processing' && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <Button onClick={() => navigate('/admin')}>
                Go to Admin Settings
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-sm text-muted-foreground text-center">{errorMessage}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/admin')}>
                  Back to Admin
                </Button>
                <Button onClick={() => navigate('/admin')}>
                  Try Again
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
