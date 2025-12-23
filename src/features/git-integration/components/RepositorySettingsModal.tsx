// Repository Settings Modal Component
// Modal for configuring repository settings like Smart Commits

import { useState, useEffect } from 'react';
import { Loader2, Settings, GitBranch, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { GitRepository } from '../types';

interface RepositorySettingsModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly repository: GitRepository | null;
  readonly onSuccess?: () => void;
}

export function RepositorySettingsModal({
  open,
  onOpenChange,
  repository,
  onSuccess,
}: RepositorySettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [smartCommitsEnabled, setSmartCommitsEnabled] = useState(true);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (repository && open) {
      setSmartCommitsEnabled(repository.smartcommits_enabled);
      setIsActive(repository.is_active);
    }
  }, [repository, open]);

  const handleSave = async () => {
    if (!repository) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('git_repositories')
        .update({
          smartcommits_enabled: smartCommitsEnabled,
          is_active: isActive,
        })
        .eq('id', repository.id);
      
      if (error) throw error;

      toast.success('Repository settings updated');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update repository:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  if (!repository) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Repository Settings
          </DialogTitle>
          <DialogDescription>
            Configure settings for {repository.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Repository Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{repository.name}</p>
              <p className="text-sm text-muted-foreground">{repository.slug}</p>
            </div>
          </div>

          <Separator />

          {/* Smart Commits Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Smart Commits
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable processing of smart commit commands in commit messages
              </p>
            </div>
            <Switch
              checked={smartCommitsEnabled}
              onCheckedChange={setSmartCommitsEnabled}
            />
          </div>

          <div className="p-3 bg-muted/50 rounded-md text-sm space-y-1">
            <p className="font-medium">Smart commit examples:</p>
            <ul className="text-muted-foreground space-y-1">
              <li><code>PROJ-123 #comment Fixed bug</code> - Add comment</li>
              <li><code>PROJ-123 #time 2h</code> - Log work</li>
              <li><code>PROJ-123 #resolve</code> - Close issue</li>
            </ul>
          </div>

          <Separator />

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="repo-active">Repository Active</Label>
              <p className="text-sm text-muted-foreground">
                Disable to pause webhook processing for this repository
              </p>
            </div>
            <Switch
              id="repo-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
