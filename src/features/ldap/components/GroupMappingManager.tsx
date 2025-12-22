import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { LdapGroupMapping, APP_ROLES } from '../types';
import {
  fetchGroupMappings,
  createGroupMapping,
  updateGroupMapping,
  deleteGroupMapping,
  fetchGroups,
  fetchProjectRoles,
} from '../services/ldapService';

interface GroupMappingManagerProps {
  configId: string;
}

interface NewMapping {
  ldap_group_dn: string;
  ldap_group_name: string;
  target_type: 'app_role' | 'project_role' | 'group';
  target_role: string;
  target_project_role_id: string;
  target_group_id: string;
}

export function GroupMappingManager({ configId }: GroupMappingManagerProps) {
  const [mappings, setMappings] = useState<LdapGroupMapping[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [projectRoles, setProjectRoles] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newMapping, setNewMapping] = useState<NewMapping>({
    ldap_group_dn: '',
    ldap_group_name: '',
    target_type: 'app_role',
    target_role: '',
    target_project_role_id: '',
    target_group_id: '',
  });

  useEffect(() => {
    loadData();
  }, [configId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [mappingsData, groupsData, rolesData] = await Promise.all([
        fetchGroupMappings(configId),
        fetchGroups(),
        fetchProjectRoles(),
      ]);
      setMappings(mappingsData);
      setGroups(groupsData);
      setProjectRoles(rolesData);
    } catch (error) {
      toast.error('Failed to load group mappings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMapping = async () => {
    if (!newMapping.ldap_group_name || !newMapping.target_type) {
      toast.error('Please fill in required fields');
      return;
    }

    const hasTarget = 
      (newMapping.target_type === 'app_role' && newMapping.target_role) ||
      (newMapping.target_type === 'project_role' && newMapping.target_project_role_id) ||
      (newMapping.target_type === 'group' && newMapping.target_group_id);

    if (!hasTarget) {
      toast.error('Please select a target role or group');
      return;
    }

    setIsSaving(true);
    try {
      const mapping = await createGroupMapping({
        ldap_config_id: configId,
        ldap_group_dn: newMapping.ldap_group_dn || `CN=${newMapping.ldap_group_name}`,
        ldap_group_name: newMapping.ldap_group_name,
        target_type: newMapping.target_type,
        target_role: newMapping.target_type === 'app_role' ? newMapping.target_role as any : null,
        target_project_role_id: newMapping.target_type === 'project_role' ? newMapping.target_project_role_id : null,
        target_group_id: newMapping.target_type === 'group' ? newMapping.target_group_id : null,
        is_active: true,
      });
      
      setMappings([...mappings, mapping]);
      setNewMapping({
        ldap_group_dn: '',
        ldap_group_name: '',
        target_type: 'app_role',
        target_role: '',
        target_project_role_id: '',
        target_group_id: '',
      });
      toast.success('Group mapping added');
    } catch (error) {
      toast.error('Failed to add mapping');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (mapping: LdapGroupMapping) => {
    try {
      const updated = await updateGroupMapping(mapping.id, { is_active: !mapping.is_active });
      setMappings(mappings.map(m => m.id === mapping.id ? updated : m));
    } catch (error) {
      toast.error('Failed to update mapping');
    }
  };

  const handleDelete = async (mappingId: string) => {
    try {
      await deleteGroupMapping(mappingId);
      setMappings(mappings.filter(m => m.id !== mappingId));
      toast.success('Mapping deleted');
    } catch (error) {
      toast.error('Failed to delete mapping');
    }
  };

  const getTargetLabel = (mapping: LdapGroupMapping) => {
    if (mapping.target_type === 'app_role') {
      return APP_ROLES.find(r => r.value === mapping.target_role)?.label || mapping.target_role;
    }
    if (mapping.target_type === 'project_role') {
      return projectRoles.find(r => r.id === mapping.target_project_role_id)?.name || 'Unknown Role';
    }
    if (mapping.target_type === 'group') {
      return groups.find(g => g.id === mapping.target_group_id)?.name || 'Unknown Group';
    }
    return 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Mappings</CardTitle>
        <CardDescription>
          Map AD/LDAP groups to application roles and groups
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new mapping form */}
        <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <label className="text-xs font-medium">LDAP Group Name</label>
            <Input
              placeholder="e.g., Developers"
              value={newMapping.ldap_group_name}
              onChange={(e) => setNewMapping({ ...newMapping, ldap_group_name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">LDAP Group DN (Optional)</label>
            <Input
              placeholder="CN=Developers,OU=Groups,..."
              value={newMapping.ldap_group_dn}
              onChange={(e) => setNewMapping({ ...newMapping, ldap_group_dn: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Target Type</label>
            <Select
              value={newMapping.target_type}
              onValueChange={(v: 'app_role' | 'project_role' | 'group') => 
                setNewMapping({ ...newMapping, target_type: v, target_role: '', target_project_role_id: '', target_group_id: '' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="app_role">Application Role</SelectItem>
                <SelectItem value="project_role">Project Role</SelectItem>
                <SelectItem value="group">Group</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Target</label>
            {newMapping.target_type === 'app_role' && (
              <Select
                value={newMapping.target_role}
                onValueChange={(v) => setNewMapping({ ...newMapping, target_role: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {APP_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {newMapping.target_type === 'project_role' && (
              <Select
                value={newMapping.target_project_role_id}
                onValueChange={(v) => setNewMapping({ ...newMapping, target_project_role_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {projectRoles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {newMapping.target_type === 'group' && (
              <Select
                value={newMapping.target_group_id}
                onValueChange={(v) => setNewMapping({ ...newMapping, target_group_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddMapping} disabled={isSaving} className="w-full">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Add
            </Button>
          </div>
        </div>

        {/* Existing mappings table */}
        {mappings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No group mappings configured. Add mappings above to sync AD groups to application roles.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>LDAP Group</TableHead>
                <TableHead>Target Type</TableHead>
                <TableHead>Maps To</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{mapping.ldap_group_name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {mapping.ldap_group_dn}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {mapping.target_type === 'app_role' && 'App Role'}
                      {mapping.target_type === 'project_role' && 'Project Role'}
                      {mapping.target_type === 'group' && 'Group'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getTargetLabel(mapping)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={mapping.is_active}
                      onCheckedChange={() => handleToggleActive(mapping)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(mapping.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
