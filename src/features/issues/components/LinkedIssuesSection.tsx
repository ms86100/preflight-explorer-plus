import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Link as LinkIcon, Plus, Trash2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

// Type bypass for tables not fully in generated types
const db = supabase as any;

interface LinkedIssue {
  readonly id: string;
  readonly source_issue_id: string;
  readonly target_issue_id: string;
  readonly link_type_id: string;
  readonly link_type_name: string;
  readonly created_at: string;
  readonly target_issue?: {
    readonly id: string;
    readonly issue_key: string;
    readonly summary: string;
    readonly status: { readonly name: string; readonly color: string };
  };
  readonly source_issue?: {
    readonly id: string;
    readonly issue_key: string;
    readonly summary: string;
    readonly status: { readonly name: string; readonly color: string };
  };
}

interface LinkType {
  id: string;
  name: string;
  inward_description: string;
  outward_description: string;
}

interface LinkedIssuesSectionProps {
  readonly issueId: string;
  readonly projectId: string;
}

export function LinkedIssuesSection({ issueId, projectId }: LinkedIssuesSectionProps) {
  const { user } = useAuth();
  const [linkedIssues, setLinkedIssues] = useState<LinkedIssue[]>([]);
  const [linkTypes, setLinkTypes] = useState<LinkType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [selectedLinkTypeId, setSelectedLinkTypeId] = useState<string>('');

  useEffect(() => {
    fetchLinkTypes();
    fetchLinkedIssues();
  }, [issueId]);

  const fetchLinkTypes = async () => {
    const { data, error } = await supabase
      .from('issue_link_types')
      .select('*');
    
    if (!error && data) {
      setLinkTypes(data);
      if (data.length > 0 && !selectedLinkTypeId) {
        setSelectedLinkTypeId(data[0].id);
      }
    }
  };

  const fetchLinkedIssues = async () => {
    setIsLoading(true);
    try {
      // Fetch outgoing links (where this issue is source)
      const { data: outgoing, error: outError } = await supabase
        .from('issue_links')
        .select(`
          id, source_issue_id, target_issue_id, link_type_id, created_at,
          target_issue:issues!issue_links_target_issue_id_fkey(
            id, issue_key, summary,
            status:issue_statuses(name, color)
          )
        `)
        .eq('source_issue_id', issueId);

      if (outError) throw outError;

      // Fetch incoming links (where this issue is target)
      const { data: incoming, error: inError } = await supabase
        .from('issue_links')
        .select(`
          id, source_issue_id, target_issue_id, link_type_id, created_at,
          source_issue:issues!issue_links_source_issue_id_fkey(
            id, issue_key, summary,
            status:issue_statuses(name, color)
          )
        `)
        .eq('target_issue_id', issueId);

      if (inError) throw inError;

      // Map link_type_id to name
      const allLinks = [...(outgoing || []), ...(incoming || [])];
      const mappedLinks: LinkedIssue[] = allLinks.map(link => {
        const linkType = linkTypes.find(lt => lt.id === link.link_type_id);
        return {
          id: link.id,
          source_issue_id: link.source_issue_id,
          target_issue_id: link.target_issue_id,
          link_type_id: link.link_type_id,
          link_type_name: linkType?.name || 'Related',
          created_at: link.created_at,
          target_issue: (link as any).target_issue,
          source_issue: (link as any).source_issue,
        };
      });

      setLinkedIssues(mappedLinks);
    } catch {
      toast.error('Failed to load linked issues');
    } finally {
      setIsLoading(false);
    }
  };

  const searchIssues = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('issues')
        .select('id, issue_key, summary')
        .eq('project_id', projectId)
        .neq('id', issueId)
        .or(`issue_key.ilike.%${query}%,summary.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch {
      // Silent failure for search - user can retry
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchIssues(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddLink = async () => {
    if (!selectedIssue || !user?.id || !selectedLinkTypeId) return;

    setIsAdding(true);
    try {
      const { error } = await db.from('issue_links').insert({
        source_issue_id: issueId,
        target_issue_id: selectedIssue,
        link_type_id: selectedLinkTypeId,
        created_by: user.id,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('This link already exists');
        } else {
          throw error;
        }
      } else {
        toast.success('Issue linked successfully');
        setShowAddDialog(false);
        setSearchQuery('');
        setSelectedIssue(null);
        fetchLinkedIssues();
      }
    } catch (error) {
      console.error('Error adding link:', error);
      toast.error('Failed to link issue');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    try {
      const { error } = await supabase.from('issue_links').delete().eq('id', linkId);
      if (error) throw error;
      toast.success('Link removed');
      fetchLinkedIssues();
    } catch (error) {
      console.error('Error removing link:', error);
      toast.error('Failed to remove link');
    }
  };

  const getLinkLabel = (link: LinkedIssue) => {
    const linkType = linkTypes.find(lt => lt.id === link.link_type_id);
    if (!linkType) return link.link_type_name;
    
    if (link.source_issue_id === issueId) {
      return linkType.outward_description;
    } else {
      return linkType.inward_description;
    }
  };

  const getLinkedIssue = (link: LinkedIssue) => {
    return link.source_issue_id === issueId ? link.target_issue : link.source_issue;
  };

  return (
    <div className="space-y-4">
      {/* Add Link Button */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-1" />
            Link Issue
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="link-type">Link Type</Label>
              <Select value={selectedLinkTypeId} onValueChange={setSelectedLinkTypeId}>
                <SelectTrigger id="link-type">
                  <SelectValue placeholder="Select link type" />
                </SelectTrigger>
                <SelectContent>
                  {linkTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.outward_description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search-issue">Search Issue</Label>
              <Input
                id="search-issue"
                placeholder="Search by key or summary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="border rounded-md max-h-[200px] overflow-y-auto">
                  {searchResults.map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      className={`p-2 w-full text-left hover:bg-accent ${
                        selectedIssue === issue.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setSelectedIssue(issue.id)}
                      aria-pressed={selectedIssue === issue.id}
                    >
                      <span className="font-medium text-primary">{issue.issue_key}</span>
                      <span className="text-sm text-muted-foreground ml-2">{issue.summary}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleAddLink}
              disabled={!selectedIssue || isAdding || !selectedLinkTypeId}
              className="w-full"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <LinkIcon className="h-4 w-4 mr-1" />}
              Link Issue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Linked Issues List */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : linkedIssues.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No linked issues</p>
        </div>
      ) : (
        <div className="space-y-2">
          {linkedIssues.map((link) => {
            const linkedIssue = getLinkedIssue(link);
            if (!linkedIssue) return null;

            return (
              <div
                key={link.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {link.source_issue_id === issueId ? (
                    <ArrowRight className="h-3 w-3" />
                  ) : (
                    <ArrowLeft className="h-3 w-3" />
                  )}
                  <span>{getLinkLabel(link)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary text-sm">{linkedIssue.issue_key}</span>
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: `${linkedIssue.status?.color}20`,
                        borderColor: linkedIssue.status?.color,
                        color: linkedIssue.status?.color,
                      }}
                      className="text-xs"
                    >
                      {linkedIssue.status?.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{linkedIssue.summary}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveLink(link.id)}
                  aria-label={`Remove link to ${linkedIssue.issue_key}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
