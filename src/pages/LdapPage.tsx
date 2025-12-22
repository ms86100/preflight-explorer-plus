import { useState } from 'react';
import { ArrowLeft, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout';
import {
  LdapConfiguration,
  LdapConfigurationList,
  LdapConfigurationForm,
  GroupMappingManager,
  LdapSyncPanel,
} from '@/features/ldap';

type ViewMode = 'list' | 'new' | 'detail';

export default function LdapPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedConfig, setSelectedConfig] = useState<LdapConfiguration | null>(null);
  const [activeTab, setActiveTab] = useState('settings');

  const handleSelectConfig = (config: LdapConfiguration) => {
    setSelectedConfig(config);
    setViewMode('detail');
  };

  const handleNewConfig = () => {
    setSelectedConfig(null);
    setViewMode('new');
  };

  const handleSaveConfig = (config: LdapConfiguration) => {
    setSelectedConfig(config);
    setViewMode('detail');
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedConfig(null);
  };

  return (
    <AppLayout>
      <div className="flex-1 p-6 bg-background">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Network className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">LDAP / Active Directory</h1>
                <p className="text-muted-foreground">
                  Sync groups and roles from your directory service
                </p>
              </div>
            </div>
          </div>

          {viewMode === 'list' && (
            <LdapConfigurationList 
              onSelect={handleSelectConfig} 
              onNew={handleNewConfig}
            />
          )}

          {viewMode === 'new' && (
            <div className="space-y-4">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Configurations
              </Button>
              <div className="border rounded-lg p-6 bg-card">
                <h2 className="text-xl font-semibold mb-6">New LDAP Configuration</h2>
                <LdapConfigurationForm
                  onSave={handleSaveConfig}
                  onCancel={handleBack}
                />
              </div>
            </div>
          )}

          {viewMode === 'detail' && selectedConfig && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Configurations
                </Button>
                <h2 className="text-xl font-semibold">{selectedConfig.name}</h2>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="mappings">Group Mappings</TabsTrigger>
                  <TabsTrigger value="sync">Sync & History</TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="mt-6">
                  <div className="border rounded-lg p-6 bg-card">
                    <LdapConfigurationForm
                      config={selectedConfig}
                      onSave={(config) => setSelectedConfig(config)}
                      onCancel={handleBack}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="mappings" className="mt-6">
                  <GroupMappingManager configId={selectedConfig.id} />
                </TabsContent>

                <TabsContent value="sync" className="mt-6">
                  <LdapSyncPanel configId={selectedConfig.id} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
