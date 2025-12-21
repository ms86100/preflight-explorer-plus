import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Clock, Plus, Trash2, Loader2 } from 'lucide-react';

interface Worklog {
  id: string;
  author_id: string;
  time_spent: number;
  started_at: string;
  description: string | null;
  created_at: string;
  author?: { display_name: string; avatar_url: string | null };
}

interface TimeTrackingSectionProps {
  issueId: string;
  originalEstimate: number | null;
  remainingEstimate: number | null;
  timeSpent: number | null;
  onUpdate?: () => void;
}

export function TimeTrackingSection({
  issueId,
  originalEstimate,
  remainingEstimate,
  timeSpent,
  onUpdate,
}: TimeTrackingSectionProps) {
  const { user } = useAuth();
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLog, setNewLog] = useState({
    hours: '',
    minutes: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchWorklogs();
  }, [issueId]);

  const fetchWorklogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('worklogs')
        .select('*')
        .eq('issue_id', issueId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      setWorklogs((data || []) as unknown as Worklog[]);
    } catch (error) {
      console.error('Error fetching worklogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWorklog = async () => {
    if (!user?.id) return;

    const hours = parseInt(newLog.hours) || 0;
    const minutes = parseInt(newLog.minutes) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes <= 0) {
      toast.error('Please enter a valid time');
      return;
    }

    setIsAddingLog(true);
    try {
      const { error } = await supabase.from('worklogs').insert({
        issue_id: issueId,
        author_id: user.id,
        time_spent: totalMinutes,
        started_at: new Date(newLog.date).toISOString(),
        description: newLog.description || null,
      });

      if (error) throw error;

      // Update issue time_spent
      const newTotalTime = (timeSpent || 0) + totalMinutes;
      await supabase
        .from('issues')
        .update({ time_spent: newTotalTime })
        .eq('id', issueId);

      toast.success('Worklog added');
      setShowAddDialog(false);
      setNewLog({ hours: '', minutes: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchWorklogs();
      onUpdate?.();
    } catch (error) {
      console.error('Error adding worklog:', error);
      toast.error('Failed to add worklog');
    } finally {
      setIsAddingLog(false);
    }
  };

  const handleDeleteWorklog = async (worklogId: string, logTimeSpent: number) => {
    try {
      const { error } = await supabase.from('worklogs').delete().eq('id', worklogId);
      if (error) throw error;

      // Update issue time_spent
      const newTotalTime = Math.max(0, (timeSpent || 0) - logTimeSpent);
      await supabase
        .from('issues')
        .update({ time_spent: newTotalTime })
        .eq('id', issueId);

      toast.success('Worklog deleted');
      fetchWorklogs();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting worklog:', error);
      toast.error('Failed to delete worklog');
    }
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const getProgress = () => {
    if (!originalEstimate || originalEstimate === 0) return 0;
    return Math.min(100, ((timeSpent || 0) / originalEstimate) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Time Summary */}
      <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Original Estimate</p>
          <p className="text-lg font-semibold">{formatTime(originalEstimate)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Time Spent</p>
          <p className="text-lg font-semibold text-primary">{formatTime(timeSpent)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p className="text-lg font-semibold">{formatTime(remainingEstimate)}</p>
        </div>
      </div>

      {/* Progress Bar */}
      {originalEstimate && originalEstimate > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(getProgress())}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getProgress() > 100 ? 'bg-destructive' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, getProgress())}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Worklog Button */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-1" />
            Log Work
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Work</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hours</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newLog.hours}
                  onChange={(e) => setNewLog({ ...newLog, hours: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Minutes</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={newLog.minutes}
                  onChange={(e) => setNewLog({ ...newLog, minutes: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={newLog.date}
                onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="What did you work on?"
                value={newLog.description}
                onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button onClick={handleAddWorklog} disabled={isAddingLog} className="w-full">
              {isAddingLog ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Clock className="h-4 w-4 mr-1" />}
              Log Work
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Worklogs List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Work Logs</h4>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : worklogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No work logged yet</p>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {worklogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between p-3 rounded-lg border bg-card">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{formatTime(log.time_spent)}</span>
                    <span className="text-xs text-muted-foreground">
                      by {log.author?.display_name || 'Unknown'}
                    </span>
                  </div>
                  {log.description && (
                    <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(log.started_at), 'MMM d, yyyy')}
                  </p>
                </div>
                {log.author_id === user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteWorklog(log.id, log.time_spent)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
