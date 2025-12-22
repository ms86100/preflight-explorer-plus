import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, Settings2 } from 'lucide-react';

interface SprintConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SprintConfigModal({ open, onOpenChange }: SprintConfigModalProps) {
  const [sprintDuration, setSprintDuration] = useState(14); // days
  const [startDay, setStartDay] = useState('monday');
  const [autoEstimate, setAutoEstimate] = useState(true);
  const [capacityTracking, setCapacityTracking] = useState(true);

  const durationOptions = [
    { value: 7, label: '1 week' },
    { value: 14, label: '2 weeks' },
    { value: 21, label: '3 weeks' },
    { value: 28, label: '4 weeks' },
  ];

  const dayOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
  ];

  const handleSave = () => {
    // In a real app, save to database/localStorage
    localStorage.setItem('sprintConfig', JSON.stringify({
      duration: sprintDuration,
      startDay,
      autoEstimate,
      capacityTracking,
    }));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Sprint Settings
          </DialogTitle>
          <DialogDescription>
            Configure default settings for new sprints
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Sprint Duration */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Default Sprint Duration
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {durationOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={sprintDuration === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSprintDuration(opt.value)}
                  className="text-xs"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Custom: {sprintDuration} days</span>
              </div>
              <Slider
                value={[sprintDuration]}
                onValueChange={(v) => setSprintDuration(v[0])}
                min={5}
                max={42}
                step={1}
              />
            </div>
          </div>

          {/* Sprint Start Day */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Sprints Start On
            </Label>
            <Select value={startDay} onValueChange={setStartDay}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Auto Estimate */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-calculate capacity</Label>
              <p className="text-xs text-muted-foreground">
                Estimate sprint capacity based on team velocity
              </p>
            </div>
            <Switch checked={autoEstimate} onCheckedChange={setAutoEstimate} />
          </div>

          {/* Capacity Tracking */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Team capacity tracking</Label>
              <p className="text-xs text-muted-foreground">
                Track individual team member availability
              </p>
            </div>
            <Switch checked={capacityTracking} onCheckedChange={setCapacityTracking} />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
