import { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Edit2, UserPlus, Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import {
  useTeamsByProject,
  useTeamMembers,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useAddTeamMember,
  useUpdateMemberRole,
  useRemoveTeamMember,
} from '../hooks/useTeams';
import type { ProjectTeam } from '../types';

interface TeamManagerProps {
  readonly projectId: string;
  readonly isProjectAdmin?: boolean;
}

export function TeamManager({ projectId, isProjectAdmin: isProjectAdminProp }: TeamManagerProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const { data: teams, isLoading } = useTeamsByProject(projectId);
  const [selectedTeam, setSelectedTeam] = useState<ProjectTeam | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [deleteConfirmTeam, setDeleteConfirmTeam] = useState<ProjectTeam | null>(null);

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  // Check if user is project admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (isProjectAdminProp !== undefined) {
        setIsAdmin(isProjectAdminProp);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Check if user is project lead or has admin role
      const { data: project } = await supabase
        .from('projects')
        .select('lead_id')
        .eq('id', projectId)
        .single();
      
      if (project?.lead_id === user.id) {
        setIsAdmin(true);
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const hasAdminRole = roles?.some(r => r.role === 'admin');
      setIsAdmin(hasAdminRole || false);
    };
    checkAdmin();
  }, [projectId, isProjectAdminProp]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    await createTeam.mutateAsync({
      projectId,
      name: newTeamName,
      description: newTeamDescription || undefined,
    });
    setNewTeamName('');
    setNewTeamDescription('');
    setIsCreateOpen(false);
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam || !newTeamName.trim()) return;
    await updateTeam.mutateAsync({
      teamId: selectedTeam.id,
      projectId,
      updates: { name: newTeamName, description: newTeamDescription || undefined },
    });
    setIsEditOpen(false);
    setSelectedTeam(null);
  };

  const handleDeleteTeam = async () => {
    if (!deleteConfirmTeam) return;
    await deleteTeam.mutateAsync({ teamId: deleteConfirmTeam.id, projectId });
    setDeleteConfirmTeam(null);
    if (selectedTeam?.id === deleteConfirmTeam.id) {
      setSelectedTeam(null);
    }
  };

  const openEditDialog = (team: ProjectTeam) => {
    setSelectedTeam(team);
    setNewTeamName(team.name);
    setNewTeamDescription(team.description || '');
    setIsEditOpen(true);
  };

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Loading teams...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Project Teams</h2>
          <p className="text-sm text-muted-foreground">
            Manage teams and their members for this project
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground uppercase">Teams</h3>
          {teams?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No teams yet</p>
                {isAdmin && (
                  <Button variant="link" onClick={() => setIsCreateOpen(true)}>
                    Create your first team
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            teams?.map((team) => (
              <Card
                key={team.id}
                className={`cursor-pointer transition-colors hover:border-primary ${
                  selectedTeam?.id === team.id ? 'border-primary bg-muted/30' : ''
                }`}
                onClick={() => setSelectedTeam(team)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTeam(team); } }}
                tabIndex={0}
                role="button"
                aria-label={`Select team: ${team.name}`}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{team.name}</CardTitle>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(team);
                          }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmTeam(team);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {team.description && (
                    <CardDescription className="text-xs">{team.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))
          )}
        </div>

        {/* Team Members */}
        <div className="lg:col-span-2">
          {selectedTeam ? (
            <TeamMembersPanel
              team={selectedTeam}
              isProjectAdmin={isAdmin}
              onAddMember={() => setIsAddMemberOpen(true)}
            />
          ) : (
            <Card className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a team to view members</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Create Team Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
            <DialogDescription>
              Create a new team for this project. Teams help organize members working together.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="create-team-name" className="text-sm font-medium">Team Name</label>
              <Input
                id="create-team-name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g., Frontend Team, QA Team"
              />
            </div>
            <div>
              <label htmlFor="create-team-description" className="text-sm font-medium">Description (optional)</label>
              <Textarea
                id="create-team-description"
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                placeholder="What does this team work on?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={!newTeamName.trim()}>
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-team-name" className="text-sm font-medium">Team Name</label>
              <Input
                id="edit-team-name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Team name"
              />
            </div>
            <div>
              <label htmlFor="edit-team-description" className="text-sm font-medium">Description</label>
              <Textarea
                id="edit-team-description"
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                placeholder="Description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTeam} disabled={!newTeamName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      {selectedTeam && (
        <AddMemberDialog
          open={isAddMemberOpen}
          onOpenChange={setIsAddMemberOpen}
          teamId={selectedTeam.id}
          projectId={projectId}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmTeam} onOpenChange={() => setDeleteConfirmTeam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmTeam?.name}"? This will remove all
              members from the team. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeam} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Team Members Panel
function TeamMembersPanel({
  team,
  isProjectAdmin,
  onAddMember,
}: Readonly<{
  team: ProjectTeam;
  isProjectAdmin: boolean;
  onAddMember: () => void;
}>) {
  const { data: members, isLoading } = useTeamMembers(team.id);
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveTeamMember();

  const handleRoleChange = async (memberId: string, newRole: 'lead' | 'member') => {
    await updateRole.mutateAsync({ memberId, teamId: team.id, role: newRole });
  };

  const handleRemove = async (memberId: string) => {
    await removeMember.mutateAsync({ memberId, teamId: team.id });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{team.name}</CardTitle>
          <CardDescription>{members?.length || 0} members</CardDescription>
        </div>
        {isProjectAdmin && (
          <Button size="sm" onClick={onAddMember}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading members...</div>
        ) : members?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No members in this team yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members?.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.profile?.avatar_url || undefined} alt={`${member.profile?.display_name || 'Team member'} avatar`} />
                    <AvatarFallback>
                      {(member.profile?.display_name || 'U')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {member.profile?.display_name || 'Unknown User'}
                      {member.role === 'lead' && (
                        <Badge variant="secondary" className="text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Lead
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {member.profile?.email}
                    </div>
                  </div>
                </div>
                {isProjectAdmin && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(value: 'lead' | 'member') => handleRoleChange(member.id, value)}
                    >
                      <SelectTrigger className="w-28 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(member.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Add Member Dialog
function AddMemberDialog({
  open,
  onOpenChange,
  teamId,
  projectId,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  projectId: string;
}>) {
  const [users, setUsers] = useState<{ id: string; display_name: string; email: string | null }[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [role, setRole] = useState<'lead' | 'member'>('member');
  const [searchQuery, setSearchQuery] = useState('');
  const addMember = useAddTeamMember();

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('is_active', true)
      .order('display_name');
    setUsers(data || []);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selectedUser) return;
    await addMember.mutateAsync({ teamId, userId: selectedUser, role });
    onOpenChange(false);
    setSelectedUser('');
    setSearchQuery('');
    setRole('member');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Search and add a user to this team
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="user-search">Search User</Label>
            <Input
              id="user-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
            />
          </div>
          <div className="max-h-48 overflow-y-auto border rounded-md">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No users found
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className={`flex items-center gap-3 p-3 w-full text-left hover:bg-muted transition-colors ${
                    selectedUser === user.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedUser(user.id)}
                  aria-pressed={selectedUser === user.id}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {(user.display_name || 'U')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{user.display_name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </button>
              ))
            )}
          </div>
          <div>
            <Label htmlFor="member-role">Role</Label>
            <Select value={role} onValueChange={(v: 'lead' | 'member') => setRole(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="lead">Team Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedUser || addMember.isPending}>
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
