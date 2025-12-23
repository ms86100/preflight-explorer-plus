import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Paperclip, Upload, Trash2, Download, FileText, Image, File, Loader2, X, Eye } from 'lucide-react';

interface Attachment {
  readonly id: string;
  readonly filename: string;
  readonly file_path: string;
  readonly file_size: number;
  readonly mime_type: string | null;
  readonly author_id: string;
  readonly created_at: string;
  readonly author?: { readonly display_name: string };
  readonly previewUrl?: string;
}

interface AttachmentsSectionProps {
  readonly issueId: string;
}

export function AttachmentsSection({ issueId }: AttachmentsSectionProps) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchAttachments();
  }, [issueId]);

  const fetchAttachments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttachments((data || []) as unknown as Attachment[]);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!user?.id) return;

    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of fileArray) {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        // Use crypto.getRandomValues for secure random string generation
        const randomBytes = new Uint8Array(8);
        crypto.getRandomValues(randomBytes);
        const randomStr = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const filePath = `${issueId}/${Date.now()}-${randomStr}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        // Create attachment record
        const { error: dbError } = await supabase.from('attachments').insert({
          issue_id: issueId,
          author_id: user.id,
          filename: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || null,
        });

        if (dbError) {
          console.error('DB error:', dbError);
          // Clean up uploaded file
          await supabase.storage.from('attachments').remove([filePath]);
          toast.error(`Failed to save ${file.name}`);
        }
      }

      toast.success('Files uploaded successfully');
      fetchAttachments();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (attachment.author_id !== user?.id) {
      toast.error('You can only delete your own attachments');
      return;
    }

    try {
      // Delete from storage
      await supabase.storage.from('attachments').remove([attachment.file_path]);

      // Delete from database
      const { error } = await supabase.from('attachments').delete().eq('id', attachment.id);
      if (error) throw error;

      toast.success('Attachment deleted');
      fetchAttachments();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error('Failed to delete attachment');
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('attachments')
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast.error('Failed to download file');
    }
  };

  const handlePreview = async (attachment: Attachment) => {
    if (!attachment.mime_type?.startsWith('image/')) {
      handleDownload(attachment);
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('attachments')
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setPreviewUrl(url);
      setPreviewAttachment(attachment);
    } catch (error) {
      console.error('Error loading preview:', error);
      toast.error('Failed to load preview');
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewAttachment(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [issueId, user]);

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return File;
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Image Preview Dialog */}
      <Dialog open={!!previewAttachment} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-background/80"
              onClick={closePreview}
            >
              <X className="h-4 w-4" />
            </Button>
            {previewUrl && (
              <img
                src={previewUrl}
                alt={previewAttachment?.filename || 'Preview'}
                className="max-w-full max-h-[80vh] mx-auto object-contain rounded"
              />
            )}
            <div className="text-center mt-2">
              <p className="text-sm font-medium">{previewAttachment?.filename}</p>
              <div className="flex justify-center gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => previewAttachment && handleDownload(previewAttachment)}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Drop Zone */}
      <section
        aria-label="File upload drop zone"
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Drag and drop files here, or{' '}
              <label className="text-primary cursor-pointer hover:underline">
                browse{' '}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                />
              </label>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Max file size: 10MB</p>
          </>
        )}
      </section>

      {/* Attachments List */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : attachments.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No attachments</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const FileIcon = getFileIcon(attachment.mime_type);
            const isImage = attachment.mime_type?.startsWith('image/');
            return (
              <button
                type="button"
                key={attachment.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer w-full text-left"
                onClick={() => handlePreview(attachment)}
                aria-label={`Preview attachment: ${attachment.filename}`}
              >
                <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file_size)} • {attachment.author?.display_name} •{' '}
                    {format(new Date(attachment.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="group" aria-label="Attachment actions">
                  {isImage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePreview(attachment)}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(attachment)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {attachment.author_id === user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(attachment)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
