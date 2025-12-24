import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColumnConfigPanel } from './ColumnConfigPanel';
import { Settings, Columns3 } from 'lucide-react';

interface BoardSettingsModalProps {
  boardId: string;
  boardName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onColumnsChanged: () => void;
}

export function BoardSettingsModal({
  boardId,
  boardName,
  open,
  onOpenChange,
  onColumnsChanged,
}: BoardSettingsModalProps) {
  const [activeTab, setActiveTab] = useState('columns');

  // Reset tab when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab('columns');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Board Settings - {boardName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="columns" className="flex items-center gap-2">
              <Columns3 className="h-4 w-4" />
              Columns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="columns" className="flex-1 overflow-auto mt-4">
            <ColumnConfigPanel
              boardId={boardId}
              onColumnsChanged={onColumnsChanged}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
