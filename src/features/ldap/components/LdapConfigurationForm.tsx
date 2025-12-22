import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Server, Shield, Settings2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LdapConfiguration, DEFAULT_LDAP_CONFIG } from '../types';
import { createLdapConfiguration, updateLdapConfiguration, testLdapConnection } from '../services/ldapService';

const ldapConfigSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  server_url: z.string().min(1, 'Server URL is required'),
  base_dn: z.string().min(1, 'Base DN is required'),
  bind_dn: z.string().optional(),
  port: z.coerce.number().min(1).max(65535),
  use_ssl: z.boolean(),
  search_filter: z.string().min(1),
  group_search_filter: z.string().min(1),
  group_base_dn: z.string().optional(),
  user_id_attribute: z.string().min(1),
  email_attribute: z.string().min(1),
  display_name_attribute: z.string().min(1),
  department_attribute: z.string().min(1),
  group_name_attribute: z.string().min(1),
  group_member_attribute: z.string().min(1),
  sync_interval_minutes: z.coerce.number().min(5).max(1440),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof ldapConfigSchema>;

interface LdapConfigurationFormProps {
  config?: LdapConfiguration | null;
  onSave: (config: LdapConfiguration) => void;
  onCancel: () => void;
}

export function LdapConfigurationForm({ config, onSave, onCancel }: LdapConfigurationFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const isEditing = !!config;

  const form = useForm<FormValues>({
    resolver: zodResolver(ldapConfigSchema),
    defaultValues: {
      name: config?.name || '',
      server_url: config?.server_url || '',
      base_dn: config?.base_dn || '',
      bind_dn: config?.bind_dn || '',
      port: config?.port || DEFAULT_LDAP_CONFIG.port || 389,
      use_ssl: config?.use_ssl || DEFAULT_LDAP_CONFIG.use_ssl || false,
      search_filter: config?.search_filter || DEFAULT_LDAP_CONFIG.search_filter || '',
      group_search_filter: config?.group_search_filter || DEFAULT_LDAP_CONFIG.group_search_filter || '',
      group_base_dn: config?.group_base_dn || '',
      user_id_attribute: config?.user_id_attribute || DEFAULT_LDAP_CONFIG.user_id_attribute || '',
      email_attribute: config?.email_attribute || DEFAULT_LDAP_CONFIG.email_attribute || '',
      display_name_attribute: config?.display_name_attribute || DEFAULT_LDAP_CONFIG.display_name_attribute || '',
      department_attribute: config?.department_attribute || DEFAULT_LDAP_CONFIG.department_attribute || '',
      group_name_attribute: config?.group_name_attribute || DEFAULT_LDAP_CONFIG.group_name_attribute || '',
      group_member_attribute: config?.group_member_attribute || DEFAULT_LDAP_CONFIG.group_member_attribute || '',
      sync_interval_minutes: config?.sync_interval_minutes || DEFAULT_LDAP_CONFIG.sync_interval_minutes || 60,
      is_active: config?.is_active ?? DEFAULT_LDAP_CONFIG.is_active ?? true,
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      let savedConfig: LdapConfiguration;
      if (isEditing && config) {
        savedConfig = await updateLdapConfiguration(config.id, values);
        toast.success('LDAP configuration updated');
      } else {
        savedConfig = await createLdapConfiguration(values);
        toast.success('LDAP configuration created');
      }
      onSave(savedConfig);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config?.id) {
      toast.error('Please save the configuration first');
      return;
    }

    setIsTesting(true);
    try {
      const result = await testLdapConnection(config.id);
      if (result.success) {
        toast.success(result.message || 'Connection test passed');
      } else {
        toast.error(result.errors?.join(', ') || 'Connection test failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="connection" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connection" className="gap-2">
              <Server className="h-4 w-4" />
              Connection
            </TabsTrigger>
            <TabsTrigger value="attributes" className="gap-2">
              <Users className="h-4 w-4" />
              Attributes
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Server Connection</CardTitle>
                <CardDescription>Configure the LDAP/Active Directory server connection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Configuration Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Corporate AD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="server_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Server URL</FormLabel>
                        <FormControl>
                          <Input placeholder="ldap://ad.company.com" {...field} />
                        </FormControl>
                        <FormDescription>LDAP or LDAPS URL</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Port</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>389 or 636 for LDAPS</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="base_dn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base DN</FormLabel>
                      <FormControl>
                        <Input placeholder="DC=company,DC=com" {...field} />
                      </FormControl>
                      <FormDescription>Base distinguished name for searches</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bind_dn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bind DN (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="CN=ServiceAccount,OU=Users,DC=company,DC=com" {...field} />
                      </FormControl>
                      <FormDescription>Service account DN for binding</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="use_ssl"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Use SSL/TLS</FormLabel>
                        <FormDescription>Enable secure connection (LDAPS)</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Filters</CardTitle>
                <CardDescription>Configure how users and groups are discovered</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="search_filter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Search Filter</FormLabel>
                      <FormControl>
                        <Input placeholder="(objectClass=user)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="group_search_filter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Search Filter</FormLabel>
                      <FormControl>
                        <Input placeholder="(objectClass=group)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="group_base_dn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Base DN (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="OU=Groups,DC=company,DC=com" {...field} />
                      </FormControl>
                      <FormDescription>Leave empty to use Base DN</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attributes" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Attributes</CardTitle>
                <CardDescription>Map LDAP attributes to user fields</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="user_id_attribute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User ID Attribute</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>e.g., sAMAccountName, uid</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email_attribute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Attribute</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>e.g., mail, userPrincipalName</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="display_name_attribute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name Attribute</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department_attribute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Attribute</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Group Attributes</CardTitle>
                <CardDescription>Configure group attribute mappings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="group_name_attribute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Name Attribute</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>e.g., cn, name</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="group_member_attribute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Member Attribute</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>e.g., member, memberOf</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sync Settings</CardTitle>
                <CardDescription>Configure synchronization behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="sync_interval_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sync Interval (Minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min={5} max={1440} {...field} />
                      </FormControl>
                      <FormDescription>How often to sync groups (5-1440 minutes)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>Enable or disable this LDAP configuration</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <div>
            {isEditing && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Shield className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Update Configuration' : 'Create Configuration'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
