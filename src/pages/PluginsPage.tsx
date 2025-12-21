import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Puzzle, Search, Download, Settings, CheckCircle, XCircle,
  Zap, BarChart3, Shield, Workflow, Bell, Layout, FileText, Lock,
  ExternalLink
} from 'lucide-react';

interface Plugin {
  id: string;
  key: string;
  name: string;
  description: string | null;
  version: string;
  vendor: string | null;
  vendor_url: string | null;
  documentation_url: string | null;
  icon_url: string | null;
  category: string;
  is_system: boolean;
  is_enabled: boolean;
}

const CATEGORY_ICONS: Record<string, typeof Puzzle> = {
  core: Layout,
  agile: Zap,
  workflow: Workflow,
  automation: Zap,
  reports: BarChart3,
  admin: Shield,
  integration: Bell,
  other: Puzzle,
};

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core',
  agile: 'Agile & Boards',
  workflow: 'Workflow',
  automation: 'Automation',
  reports: 'Reports',
  admin: 'Administration',
  integration: 'Integrations',
  other: 'Other',
};

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    try {
      const { data, error } = await supabase
        .from('plugins')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name');

      if (error) throw error;
      setPlugins(data || []);
    } catch (error) {
      console.error('Error fetching plugins:', error);
      toast.error('Failed to load plugins');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlugin = async (plugin: Plugin) => {
    if (plugin.is_system) {
      toast.error('System plugins cannot be disabled');
      return;
    }

    try {
      const { error } = await supabase
        .from('plugins')
        .update({ is_enabled: !plugin.is_enabled })
        .eq('id', plugin.id);

      if (error) throw error;
      toast.success(`${plugin.name} ${plugin.is_enabled ? 'disabled' : 'enabled'}`);
      fetchPlugins();
    } catch (error) {
      console.error('Error toggling plugin:', error);
      toast.error('Failed to update plugin');
    }
  };

  const filteredPlugins = plugins.filter((plugin) => {
    const matchesSearch =
      !searchQuery ||
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || plugin.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const systemPlugins = filteredPlugins.filter((p) => p.is_system);
  const marketplacePlugins = filteredPlugins.filter((p) => !p.is_system);

  const categories = [...new Set(plugins.map((p) => p.category))];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Puzzle className="h-6 w-6" />
              Plugins & Extensions
            </h1>
            <p className="text-muted-foreground">Manage installed plugins and discover new ones</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {CATEGORY_LABELS[category] || category}
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="installed" className="space-y-4">
          <TabsList>
            <TabsTrigger value="installed">
              Installed ({plugins.filter((p) => p.is_enabled).length})
            </TabsTrigger>
            <TabsTrigger value="system">System ({systemPlugins.length})</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          </TabsList>

          <TabsContent value="installed" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {filteredPlugins.filter((p) => p.is_enabled).map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  onToggle={() => togglePlugin(plugin)}
                />
              ))}
            </div>
            {filteredPlugins.filter((p) => p.is_enabled).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Puzzle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No plugins match your search</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {systemPlugins.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  onToggle={() => togglePlugin(plugin)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4">
            <Card>
              <CardContent className="py-12 text-center">
                <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Plugin Marketplace</h3>
                <p className="text-muted-foreground mb-4">
                  Browse and install plugins from the marketplace to extend functionality.
                </p>
                <div className="flex justify-center gap-4">
                  <Card className="p-4 text-left max-w-xs cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">ScriptRunner</p>
                        <p className="text-xs text-muted-foreground">Groovy scripting</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Coming Soon</p>
                  </Card>
                  <Card className="p-4 text-left max-w-xs cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="font-medium">eazyBI</p>
                        <p className="text-xs text-muted-foreground">Advanced reporting</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Coming Soon</p>
                  </Card>
                  <Card className="p-4 text-left max-w-xs cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <Lock className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="font-medium">Insight</p>
                        <p className="text-xs text-muted-foreground">Asset management</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Coming Soon</p>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function PluginCard({ plugin, onToggle }: { plugin: Plugin; onToggle: () => void }) {
  const CategoryIcon = CATEGORY_ICONS[plugin.category] || Puzzle;

  return (
    <Card className={`transition-all ${!plugin.is_enabled ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CategoryIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {plugin.name}
                {plugin.is_system && (
                  <Badge variant="secondary" className="text-xs">System</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                v{plugin.version} {plugin.vendor && `by ${plugin.vendor}`}
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={plugin.is_enabled}
            onCheckedChange={onToggle}
            disabled={plugin.is_system}
          />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {plugin.description || 'No description available'}
        </p>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {CATEGORY_LABELS[plugin.category] || plugin.category}
          </Badge>
          <div className="flex items-center gap-2">
            {plugin.is_enabled ? (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <CheckCircle className="h-3 w-3" /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <XCircle className="h-3 w-3" /> Disabled
              </span>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
