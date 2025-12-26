import React, { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { SpacesList } from '../components/SpacesList';
import { PageEditor } from './editor/PageEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateSpace, useCreatePage, useUpdatePage } from '../hooks/useKnowledgeBase';
import { toast } from 'sonner';
import type { SpaceWithStats, SpaceType, CreateSpaceInput, ContentBlock, PageStatus } from '../types';

const spaceTypes: Array<{ value: SpaceType; label: string }> = [
  { value: 'team', label: 'Team Space' },
  { value: 'project', label: 'Project Space' },
  { value: 'personal', label: 'Personal Space' },
  { value: 'documentation', label: 'Documentation' },
];

export function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<'spaces' | 'editor'>('spaces');
  const [selectedSpace, setSelectedSpace] = useState<SpaceWithStats | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateSpaceInput>({
    key: '',
    name: '',
    description: '',
    type: 'team',
  });
  
  const createSpace = useCreateSpace();
  const createPage = useCreatePage();
  const updatePage = useUpdatePage();

  const handleSpaceSelect = (space: SpaceWithStats) => {
    setSelectedSpace(space);
    setActiveTab('editor');
    toast.success(`Opening space: ${space.name}`);
  };

  const handleEditorSave = async (title: string, content: ContentBlock[], status: PageStatus) => {
    if (!selectedSpace) {
      toast.error('No space selected');
      return;
    }
    
    try {
      await createPage.mutateAsync({
        space_id: selectedSpace.id,
        title,
        content,
        status,
      });
      toast.success('Page saved successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleEditorCancel = () => {
    setActiveTab('spaces');
    setSelectedSpace(null);
  };

  const handleCreateSpace = () => {
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.key || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      await createSpace.mutateAsync(formData);
      setIsCreateDialogOpen(false);
      setFormData({ key: '', name: '', description: '', type: 'team' });
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold">Knowledge Base</h1>
              <p className="text-muted-foreground text-sm">
                Create, organize, and share documentation
              </p>
            </div>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'spaces' | 'editor')}>
              <TabsList>
                <TabsTrigger value="spaces">Spaces</TabsTrigger>
                <TabsTrigger value="editor" disabled={!selectedSpace}>
                  Editor {selectedSpace && `(${selectedSpace.key})`}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'spaces' ? (
            <div className="container mx-auto py-6 px-4 max-w-7xl overflow-y-auto h-full">
              <SpacesList 
                onSpaceSelect={handleSpaceSelect}
                onCreateSpace={handleCreateSpace}
              />
            </div>
          ) : (
            <PageEditor
              isNew
              onSave={handleEditorSave}
              onCancel={handleEditorCancel}
              isSaving={createPage.isPending}
            />
          )}
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Space</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="space-name">Space Name *</Label>
              <Input
                id="space-name"
                placeholder="e.g., Engineering Docs"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="space-key">Space Key *</Label>
              <Input
                id="space-key"
                placeholder="e.g., ENG"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                A short unique identifier (max 10 characters)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="space-type">Space Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: SpaceType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="space-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {spaceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="space-description">Description</Label>
              <Textarea
                id="space-description"
                placeholder="What is this space for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSpace.isPending}>
                {createSpace.isPending ? 'Creating...' : 'Create Space'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
