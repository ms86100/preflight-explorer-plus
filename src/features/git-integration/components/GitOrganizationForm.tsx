import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateGitOrganization } from '../hooks/useGitOrganizations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const patFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  provider_type: z.enum(['gitlab', 'github', 'bitbucket']),
  host_url: z.string().url('Must be a valid URL'),
  access_token: z.string().min(1, 'Access token is required'),
  webhook_secret: z.string().optional(),
});

const oauthFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  provider_type: z.enum(['gitlab', 'github', 'bitbucket']),
  host_url: z.string().url('Must be a valid URL'),
  client_id: z.string().min(1, 'Client ID is required'),
  client_secret: z.string().min(1, 'Client Secret is required'),
  webhook_secret: z.string().optional(),
});

type PatFormValues = z.infer<typeof patFormSchema>;
type OAuthFormValues = z.infer<typeof oauthFormSchema>;

const PROVIDER_DEFAULTS: Record<string, string> = {
  gitlab: 'https://gitlab.com',
  github: 'https://github.com',
  bitbucket: 'https://bitbucket.org',
};

interface GitOrganizationFormProps {
  readonly onSuccess?: () => void;
}

export function GitOrganizationForm({ onSuccess }: GitOrganizationFormProps) {
  const [open, setOpen] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [authMethod, setAuthMethod] = useState<'pat' | 'oauth'>('pat');
  const [isOAuthPending, setIsOAuthPending] = useState(false);
  const createOrg = useCreateGitOrganization();

  const patForm = useForm<PatFormValues>({
    resolver: zodResolver(patFormSchema),
    defaultValues: {
      name: '',
      provider_type: 'gitlab',
      host_url: PROVIDER_DEFAULTS.gitlab,
      access_token: '',
      webhook_secret: '',
    },
  });

  const oauthForm = useForm<OAuthFormValues>({
    resolver: zodResolver(oauthFormSchema),
    defaultValues: {
      name: '',
      provider_type: 'gitlab',
      host_url: PROVIDER_DEFAULTS.gitlab,
      client_id: '',
      client_secret: '',
      webhook_secret: '',
    },
  });

  const selectedPatProvider = patForm.watch('provider_type');
  const selectedOAuthProvider = oauthForm.watch('provider_type');

  const handlePatProviderChange = (value: string) => {
    patForm.setValue('provider_type', value as PatFormValues['provider_type']);
    patForm.setValue('host_url', PROVIDER_DEFAULTS[value] || '');
  };

  const handleOAuthProviderChange = (value: string) => {
    oauthForm.setValue('provider_type', value as OAuthFormValues['provider_type']);
    oauthForm.setValue('host_url', PROVIDER_DEFAULTS[value] || '');
  };

  const onPatSubmit = async (values: PatFormValues) => {
    await createOrg.mutateAsync({
      name: values.name,
      provider_type: values.provider_type,
      host_url: values.host_url,
      access_token_encrypted: values.access_token,
      webhook_secret: values.webhook_secret || undefined,
    });
    patForm.reset();
    setOpen(false);
    onSuccess?.();
  };

  const onOAuthSubmit = async (values: OAuthFormValues) => {
    setIsOAuthPending(true);
    
    try {
      // First create the organization record
      const orgResult = await createOrg.mutateAsync({
        name: values.name,
        provider_type: values.provider_type,
        host_url: values.host_url,
        oauth_client_id: values.client_id,
        oauth_client_secret_encrypted: values.client_secret,
        webhook_secret: values.webhook_secret || undefined,
      });

      // Get the callback URL for this app
      const redirectUri = `${window.location.origin}/oauth/git/callback`;

      // Initiate OAuth flow
      const { data, error } = await supabase.functions.invoke('git-oauth/initiate', {
        body: {
          organization_id: orgResult.id,
          provider: values.provider_type,
          host_url: values.host_url,
          client_id: values.client_id,
          redirect_uri: redirectUri,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to initiate OAuth');
      }

      // Store OAuth params for callback
      sessionStorage.setItem('git_oauth_params', JSON.stringify({
        state: data.state,
        organization_id: orgResult.id,
        client_id: values.client_id,
        client_secret: values.client_secret,
        redirect_uri: redirectUri,
      }));

      // Redirect to OAuth provider
      window.location.href = data.auth_url;
    } catch (error) {
      console.error('OAuth initiation failed:', error);
      toast.error('Failed to start OAuth flow');
      setIsOAuthPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Git Provider
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Connect Git Provider</DialogTitle>
          <DialogDescription>
            Connect your GitLab, GitHub, or Bitbucket to link repositories with issues.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'pat' | 'oauth')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pat">Personal Access Token</TabsTrigger>
            <TabsTrigger value="oauth">OAuth App</TabsTrigger>
          </TabsList>

          <TabsContent value="pat" className="mt-4">
            <Form {...patForm}>
              <form onSubmit={patForm.handleSubmit(onPatSubmit)} className="space-y-4">
                <FormField
                  control={patForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Connection Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My GitLab" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={patForm.control}
                  name="provider_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={handlePatProviderChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gitlab">GitLab</SelectItem>
                          <SelectItem value="github">GitHub</SelectItem>
                          <SelectItem value="bitbucket">Bitbucket</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={patForm.control}
                  name="host_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://gitlab.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Use the default URL or your self-hosted instance URL.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={patForm.control}
                  name="access_token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Access Token</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showToken ? 'text' : 'password'}
                            placeholder="Enter your access token"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowToken(!showToken)}
                          >
                            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        {selectedPatProvider === 'gitlab' && 'Create a token with api scope in GitLab > Settings > Access Tokens'}
                        {selectedPatProvider === 'github' && 'Create a token with repo scope in GitHub > Settings > Developer settings > Personal access tokens'}
                        {selectedPatProvider === 'bitbucket' && 'Create an app password with repository read/write permissions'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={patForm.control}
                  name="webhook_secret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook Secret (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Optional secret for webhook validation"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Used to validate incoming webhook requests.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createOrg.isPending}>
                    {createOrg.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Connect
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="oauth" className="mt-4">
            <Form {...oauthForm}>
              <form onSubmit={oauthForm.handleSubmit(onOAuthSubmit)} className="space-y-4">
                <FormField
                  control={oauthForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Connection Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My GitLab" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={oauthForm.control}
                  name="provider_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={handleOAuthProviderChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gitlab">GitLab</SelectItem>
                          <SelectItem value="github">GitHub</SelectItem>
                          <SelectItem value="bitbucket">Bitbucket</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={oauthForm.control}
                  name="host_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://gitlab.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Use the default URL or your self-hosted instance URL.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="p-3 bg-muted rounded-lg text-sm mb-2">
                  <p className="font-medium mb-2">OAuth App Setup</p>
                  <p className="text-muted-foreground mb-2">
                    Create an OAuth application in your Git provider with this callback URL:
                  </p>
                  <code className="block bg-background p-2 rounded text-xs break-all">
                    {window.location.origin}/oauth/git/callback
                  </code>
                  <div className="mt-2">
                    <a
                      href={
                        selectedOAuthProvider === 'github'
                          ? 'https://github.com/settings/developers'
                          : selectedOAuthProvider === 'gitlab'
                          ? `${oauthForm.watch('host_url')}/-/profile/applications`
                          : 'https://bitbucket.org/account/settings/app-authorizations/'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Create OAuth App <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <FormField
                  control={oauthForm.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client ID / Application ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter OAuth client ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={oauthForm.control}
                  name="client_secret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Secret</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showClientSecret ? 'text' : 'password'}
                            placeholder="Enter OAuth client secret"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowClientSecret(!showClientSecret)}
                          >
                            {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={oauthForm.control}
                  name="webhook_secret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook Secret (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Optional secret for webhook validation"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createOrg.isPending || isOAuthPending}>
                    {(createOrg.isPending || isOAuthPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Connect with OAuth
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
