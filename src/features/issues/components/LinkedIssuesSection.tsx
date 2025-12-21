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

interface LinkedIssue {
  id: string;
  source_issue_id: string;
  target_issue_id: string;
  link_type: string;
  created_at: string;
  target_issue?: {
    id: string;
    issue_key: string;
    summary: string;
    status: { name: string; color: string };
  };
  source_issue?: {
    id: string;
    issue_key: string;
    summary: string;
    status: { name: string; color: string };
  };
}

interface LinkedIssuesSectionProps {
  issueId: string;
  projectId: string;
}

const LINK_TYPES = [
  { value: 'blocks', label: 'blocks', inverse: 'is blocked by' },
  { value: 'is_blocked_by', label: 'is blocked by', inverse: 'blocks' },
  { value: 'relates_to', label: 'relates to', inverse: 'relates to' },
  { value: 'duplicates', label: 'duplicates', inverse: 'is duplicated by' },
  { value: 'is_duplicated_by', label: 'is duplicated by', inverse: 'duplicates' },
  { value: 'clones', label: 'clones', inverse: 'is cloned by' },
  { value: 'is_cloned_by', label: 'is cloned by', inverse: 'clones' },
];

export function LinkedIssuesSection({ issueId, projectId }: LinkedIssuesSectionProps) {
  const { user } = useAuth();
  const [linkedIssues, setLinkedIssues] = useState<LinkedIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [linkType, setLinkType] = useState('relates_to');

  useEffect(() => {
    fetchLinkedIssues();
  }, [issueId]);

  const fetchLinkedIssues = async () => {
    setIsLoading(true);
    try {
      // Fetch outgoing links (where this issue is source)
      const { data: outgoing, error: outError } = await supabase
        .from('issue_links')
        .select(`
          *,
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
          *,
          source_issue:issues!issue_links_source_issue_id_fkey(
            id, issue_key, summary,
            status:issue_statuses(name, color)
          )
        `)
        .eq('target_issue_id', issueId);

      if (inError) throw inError;

      setLinkedIssues([...(outgoing || []), ...(incoming || [])]);
    } catch (error) {
      console.error('Error fetching linked issues:', error);
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
    } catch (error) {
      console.error('Error searching issues:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchIssues(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddLink = async () => {
    if (!selectedIssue || !user?.id) return;

    setIsAdding(true);
    try {
      const { error } = await supabase.from('issue_links').insert({
        source_issue_id: issueId,
        target_issue_id: selectedIssue,
        link_type: linkType,
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
        setLinkType('relates_to');
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
    const linkInfo = LINK_TYPES.find((t) => t.value === link.link_type);
    if (link.source_issue_id === issueId) {
      return linkInfo?.label || link.link_type;
    } else {
      return linkInfo?.inverse || link.link_type;
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
              <Label>Link Type</Label>
              <Select value={linkType} onValueChange={setLinkType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search Issue</Label>
              <Input
                placeholder="Search by key or summary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="border rounded-md max-h-[200px] overflow-y-auto">
                  {searchResults.map((issue) => (
                    <div
                      key={issue.id}
                      className={`p-2 cursor-pointer hover:bg-accent ${
                        selectedIssue === issue.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setSelectedIssue(issue.id)}
                    >
                      <span className="font-medium text-primary">{issue.issue_key}</span>
                      <span className="text-sm text-muted-foreground ml-2">{issue.summary}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleAddLink}
              disabled={!selectedIssue || isAdding}
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
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveLink(link.id)}
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
