import React, { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { SpacesList } from '../components/SpacesList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateSpace } from '../hooks/useKnowledgeBase';
import { toast } from 'sonner';
import type { SpaceWithStats, SpaceType, CreateSpaceInput } from '../types';

const spaceTypes: Array<{ value: SpaceType; label: string }> = [
  { value: 'team', label: 'Team Space' },
  { value: 'project', label: 'Project Space' },
  { value: 'personal', label: 'Personal Space' },
  { value: 'documentation', label: 'Documentation' },
];

export function KnowledgeBasePage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateSpaceInput>({
    key: '',
    name: '',
    description: '',
    type: 'team',
  });
  
  const createSpace = useCreateSpace();

  const handleSpaceSelect = (space: SpaceWithStats) => {
    toast.info(`Opening space: ${space.name}`);
    // TODO: Navigate to space view
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
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Create, organize, and share documentation with your team
          </p>
        </div>

        <SpacesList 
          onSpaceSelect={handleSpaceSelect}
          onCreateSpace={handleCreateSpace}
        />
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
