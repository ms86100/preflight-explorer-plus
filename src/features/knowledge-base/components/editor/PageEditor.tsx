import React, { useState, useCallback, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Eye, 
  MoreHorizontal, 
  Clock, 
  FileText,
  Send,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditableBlock } from './EditableBlock';
import { SlashCommandMenu, type SlashCommand } from './SlashCommandMenu';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { createContentBlock, duplicateContentBlock } from '../../services/knowledgeBaseService';
import type { ContentBlock, PageWithMeta, PageStatus } from '../../types';

interface PageEditorProps {
  readonly page?: PageWithMeta;
  readonly isNew?: boolean;
  readonly onSave: (title: string, content: ContentBlock[], status: PageStatus) => void;
  readonly onCancel: () => void;
  readonly isSaving?: boolean;
}

export function PageEditor({
  page,
  isNew = false,
  onSave,
  onCancel,
  isSaving = false,
}: PageEditorProps) {
  const [title, setTitle] = useState(page?.title ?? '');
  const [blocks, setBlocks] = useState<ContentBlock[]>(
    page?.content ?? [createContentBlock('paragraph')]
  );
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Slash command menu state
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashQuery, setSlashQuery] = useState('');
  const [slashBlockIndex, setSlashBlockIndex] = useState<number | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    setIsDirty(true);
  }, []);

  const handleBlockChange = useCallback((index: number, content: string) => {
    setBlocks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], content };
      return updated;
    });
    setIsDirty(true);
    
    // Check for slash command
    if (content.startsWith('/')) {
      const query = content.slice(1);
      setSlashQuery(query);
      setSlashBlockIndex(index);
      
      // Calculate position for menu
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSlashMenuPosition({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
      setSlashMenuOpen(true);
    } else {
      setSlashMenuOpen(false);
      setSlashQuery('');
    }
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    const block = blocks[index];
    
    // Enter key creates new block
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newBlock = createContentBlock('paragraph');
      setBlocks((prev) => {
        const updated = [...prev];
        updated.splice(index + 1, 0, newBlock);
        return updated;
      });
      setSelectedBlockIndex(index + 1);
      setIsDirty(true);
      return;
    }
    
    // Backspace on empty block deletes it
    if (e.key === 'Backspace' && !block.content && blocks.length > 1) {
      e.preventDefault();
      handleDeleteBlock(index);
      return;
    }
    
    // Arrow keys for navigation
    if (e.key === 'ArrowUp' && index > 0) {
      const selection = window.getSelection();
      if (selection && isAtStart(selection)) {
        e.preventDefault();
        setSelectedBlockIndex(index - 1);
      }
    }
    
    if (e.key === 'ArrowDown' && index < blocks.length - 1) {
      const selection = window.getSelection();
      if (selection && isAtEnd(selection)) {
        e.preventDefault();
        setSelectedBlockIndex(index + 1);
      }
    }
  }, [blocks]);

  const isAtStart = (selection: Selection): boolean => {
    return selection.anchorOffset === 0;
  };

  const isAtEnd = (selection: Selection): boolean => {
    const node = selection.anchorNode;
    return selection.anchorOffset === (node?.textContent?.length ?? 0);
  };

  const handleSlashCommand = useCallback((command: SlashCommand) => {
    if (slashBlockIndex === null) return;
    
    setBlocks((prev) => {
      const updated = [...prev];
      updated[slashBlockIndex] = createContentBlock(
        command.blockType,
        '',
        command.attributes ?? {}
      );
      return updated;
    });
    
    setSlashMenuOpen(false);
    setSlashQuery('');
    setSelectedBlockIndex(slashBlockIndex);
    setIsDirty(true);
  }, [slashBlockIndex]);

  const handleAddBlockAfter = useCallback((index: number) => {
    const newBlock = createContentBlock('paragraph');
    setBlocks((prev) => {
      const updated = [...prev];
      updated.splice(index + 1, 0, newBlock);
      return updated;
    });
    setSelectedBlockIndex(index + 1);
    setIsDirty(true);
  }, []);

  const handleDeleteBlock = useCallback((index: number) => {
    if (blocks.length <= 1) return;
    
    setBlocks((prev) => prev.filter((_, i) => i !== index));
    setSelectedBlockIndex(Math.max(0, index - 1));
    setIsDirty(true);
  }, [blocks.length]);

  const handleMoveBlock = useCallback((index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= blocks.length) return;
    
    setBlocks((prev) => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
    setSelectedBlockIndex(newIndex);
    setIsDirty(true);
  }, [blocks.length]);

  const handleDuplicateBlock = useCallback((index: number) => {
    const block = blocks[index];
    const duplicated = duplicateContentBlock(block);
    
    setBlocks((prev) => {
      const updated = [...prev];
      updated.splice(index + 1, 0, duplicated);
      return updated;
    });
    setSelectedBlockIndex(index + 1);
    setIsDirty(true);
  }, [blocks]);

  const handleSave = useCallback((status: PageStatus = 'draft') => {
    onSave(title, blocks, status);
    setIsDirty(false);
  }, [title, blocks, onSave]);

  const statusBadge = useMemo(() => {
    if (!page) return null;
    
    const variants: Record<PageStatus, 'default' | 'secondary' | 'outline'> = {
      draft: 'secondary',
      published: 'default',
      archived: 'outline',
    };
    
    return (
      <Badge variant={variants[page.status]}>
        {page.status}
      </Badge>
    );
  }, [page]);

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          {statusBadge}
          {isDirty && (
            <Badge variant="outline" className="text-warning border-warning">
              Unsaved changes
            </Badge>
          )}
          {page?.updated_at && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last saved {new Date(page.updated_at).toLocaleString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? <FileText className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave('draft')}
            disabled={isSaving || !isDirty}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          
          <Button
            size="sm"
            onClick={() => handleSave('published')}
            disabled={isSaving}
          >
            <Send className="h-4 w-4 mr-2" />
            Publish
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View history</DropdownMenuItem>
              <DropdownMenuItem>Export</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onCancel}>
                Discard changes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Editor Content */}
      <div 
        ref={editorRef}
        className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full"
      >
        {/* Title */}
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled"
          className="text-4xl font-bold border-0 px-0 h-auto focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/50"
        />
        
        {/* Content Blocks */}
        <div className="mt-8 space-y-2 pl-16">
          {isPreview ? (
            // Preview Mode
            <div className="space-y-4">
              {blocks.map((block) => (
                <ContentBlockRenderer key={block.id} block={block} />
              ))}
            </div>
          ) : (
            // Edit Mode
            blocks.map((block, index) => (
              <EditableBlock
                key={block.id}
                block={block}
                isSelected={selectedBlockIndex === index}
                onSelect={() => setSelectedBlockIndex(index)}
                onChange={(content) => handleBlockChange(index, content)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onAddBlockAfter={() => handleAddBlockAfter(index)}
                onDelete={() => handleDeleteBlock(index)}
                onMoveUp={() => handleMoveBlock(index, 'up')}
                onMoveDown={() => handleMoveBlock(index, 'down')}
                onDuplicate={() => handleDuplicateBlock(index)}
              />
            ))
          )}
        </div>
      </div>

      {/* Slash Command Menu */}
      <SlashCommandMenu
        isOpen={slashMenuOpen}
        position={slashMenuPosition}
        searchQuery={slashQuery}
        onSelect={handleSlashCommand}
        onClose={() => setSlashMenuOpen(false)}
      />
    </div>
  );
}
