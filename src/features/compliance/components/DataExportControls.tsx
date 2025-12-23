import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Download, 
  FileText, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ClassificationBadge, ClassificationLevel } from './ClassificationBadge';

interface ExportRequest {
  id: string;
  user_id: string;
  export_type: string;
  classification_level: string;
  record_count: number | null;
  file_format: string | null;
  status: string;
  approver_id: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  completed_at: string | null;
}

export function DataExportControls() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<string>('issues');
  const [classificationLevel, setClassificationLevel] = useState<string>('restricted');
  const [fileFormat, setFileFormat] = useState<string>('csv');

  const { data: exportRequests, isLoading } = useQuery({
    queryKey: ['export-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('export_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as ExportRequest[];
    },
  });

  const createExportRequest = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('export_audit_logs')
        .insert({
          user_id: user?.id,
          export_type: exportType,
          classification_level: classificationLevel,
          file_format: fileFormat,
          status: classificationLevel === 'public' ? 'completed' : 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['export-requests'] });
      setIsDialogOpen(false);
      if (data.status === 'completed') {
        toast.success('Export completed successfully');
      } else {
        toast.info('Export request submitted for approval');
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to create export request: ' + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400"><Clock className="h-3 w-3 mr-1" />Pending Approval</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const requiresApproval = (level: string) => {
    return level !== 'public';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Data Export Controls
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <FileText className="h-4 w-4 mr-2" />
              New Export Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Data Export</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Export Type</label>
                <Select value={exportType} onValueChange={setExportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="issues">Issues</SelectItem>
                    <SelectItem value="projects">Projects</SelectItem>
                    <SelectItem value="attachments">Attachments</SelectItem>
                    <SelectItem value="full_backup">Full Backup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Classification Level</label>
                <Select value={classificationLevel} onValueChange={setClassificationLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="export_controlled">Export Controlled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">File Format</label>
                <Select value={fileFormat} onValueChange={setFileFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {requiresApproval(classificationLevel) && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-400">Approval Required</p>
                      <p className="text-sm text-muted-foreground">
                        Exports containing {classificationLevel.replace('_', ' ')} data require 
                        administrator approval before processing.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createExportRequest.mutate()}
                  disabled={createExportRequest.isPending}
                >
                  {requiresApproval(classificationLevel) ? 'Submit for Approval' : 'Export Now'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        ) : exportRequests?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Download className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No export requests</p>
            <p className="text-sm">Request a data export to get started</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exportRequests?.map(request => (
                <TableRow key={request.id}>
                  <TableCell className="text-sm">
                    {format(new Date(request.created_at), 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell className="capitalize">
                    {request.export_type.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    <ClassificationBadge 
                      level={request.classification_level as ClassificationLevel} 
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="uppercase text-xs">
                    {request.file_format || '-'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(request.status)}
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
