import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout';
import { useProject } from '@/features/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Layers, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Loader2,
  FolderKanban,
} from 'lucide-react';
import { toast } from 'sonner';

interface Component {
  id: string;
  name: string;
  description: string | null;
  lead_id: string | null;
  project_id: string;
  created_at: string;
  lead?: { display_name: string | null; avatar_url: string | null } | null;
}

interface TeamMember {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function ComponentsPage() {
  const { projectKey } = useParams<{ projectKey: string }>();
  const { data: project } = useProject(projectKey || '');
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [newComponent, setNewComponent] = useState({
    name: '',
    description: '',
    lead_id: '',
  });

  const { data: components, isLoading } = useQuery({
    queryKey: ['components', project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      const { data, error } = await supabase
        .from('components')
        .select('*')
        .eq('project_id', project.id)
        .order('name');
      if (error) throw error;
      
      // Fetch leads separately
      const leadIds = data.filter(c => c.lead_id).map(c => c.lead_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', leadIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return data.map(c => ({
        ...c,
        lead: c.lead_id ? profileMap.get(c.lead_id) || null : null,
      })) as Component[];
    },
    enabled: !!project?.id,
  });

  const { data: teamMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url');
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const createComponent = useMutation({
    mutationFn: async () => {
      if (!project?.id) throw new Error('No project');
      const { error } = await supabase.from('components').insert({
        project_id: project.id,
        name: newComponent.name,
        description: newComponent.description || null,
        lead_id: newComponent.lead_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      setIsCreateOpen(false);
      setNewComponent({ name: '', description: '', lead_id: '' });
      toast.success('Component created');
    },
    onError: () => toast.error('Failed to create component'),
  });

  const updateComponent = useMutation({
    mutationFn: async () => {
      if (!selectedComponent) throw new Error('No component selected');
      const { error } = await supabase
        .from('components')
        .update({
          name: newComponent.name,
          description: newComponent.description || null,
          lead_id: newComponent.lead_id || null,
        })
        .eq('id', selectedComponent.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      setIsEditOpen(false);
      setSelectedComponent(null);
      toast.success('Component updated');
    },
    onError: () => toast.error('Failed to update component'),
  });

  const deleteComponent = useMutation({
    mutationFn: async (componentId: string) => {
      const { error } = await supabase.from('components').delete().eq('id', componentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      toast.success('Component deleted');
    },
    onError: () => toast.error('Failed to delete component'),
  });

  const handleEdit = (component: Component) => {
    setSelectedComponent(component);
    setNewComponent({
      name: component.name,
      description: component.description || '',
      lead_id: component.lead_id || '',
    });
    setIsEditOpen(true);
  };

  if (isLoading) {
    return (
      <AppLayout showSidebar projectKey={projectKey}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showSidebar projectKey={projectKey}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Layers className="h-6 w-6" />
              Components
            </h1>
            <p className="text-muted-foreground">
              Organize issues into logical groupings for {project?.name}
            </p>
          </div>
          <Button onClick={() => {
            setNewComponent({ name: '', description: '', lead_id: '' });
            setIsCreateOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Component
          </Button>
        </div>

        {components?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Layers className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No components yet</h3>
              <p className="text-muted-foreground mb-4">
                Components help you organize issues by area, team, or feature.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first component
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components?.map((component) => (
                  <TableRow key={component.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4 text-primary" />
                        {component.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {component.description || '-'}
                    </TableCell>
                    <TableCell>
                      {component.lead ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={component.lead.avatar_url || ''} alt={`${component.lead.display_name || 'Component lead'} avatar`} />
                            <AvatarFallback className="text-xs">
                              {component.lead.display_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{component.lead.display_name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(component)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteComponent.mutate(component.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Create/Edit Component Dialog */}
      <Dialog 
        open={isCreateOpen || isEditOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setIsEditOpen(false);
            setSelectedComponent(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditOpen ? 'Edit Component' : 'Create Component'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="component-name">Name</Label>
              <Input
                id="component-name"
                placeholder="e.g., Backend API"
                value={newComponent.name}
                onChange={(e) => setNewComponent(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="component-description">Description</Label>
              <Textarea
                id="component-description"
                placeholder="What does this component cover?"
                value={newComponent.description}
                onChange={(e) => setNewComponent(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="component-lead">Component Lead</Label>
              <Select 
                value={newComponent.lead_id} 
                onValueChange={(value) => setNewComponent(prev => ({ ...prev, lead_id: value }))}
              >
                <SelectTrigger id="component-lead">
                  <SelectValue placeholder="Select a lead (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers?.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.avatar_url || ''} alt={`${member.display_name || 'Team member'} avatar`} />
                          <AvatarFallback className="text-xs">
                            {member.display_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {member.display_name || 'Unknown'}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => isEditOpen ? updateComponent.mutate() : createComponent.mutate()} 
              disabled={!newComponent.name}
            >
              {isEditOpen ? 'Save Changes' : 'Create Component'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
