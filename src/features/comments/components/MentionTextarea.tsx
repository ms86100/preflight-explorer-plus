import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface MentionUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onMentions?: (userIds: string[]) => void;
  placeholder?: string;
  rows?: number;
  projectId?: string;
  disabled?: boolean;
}

export function MentionTextarea({
  value,
  onChange,
  onMentions,
  placeholder = 'Add a comment... Use @ to mention someone',
  rows = 3,
  projectId,
  disabled = false,
}: MentionTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [allUsers, setAllUsers] = useState<MentionUser[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [projectId]);

  const fetchUsers = async () => {
    // Use secure RPC to fetch public profiles (non-sensitive fields only)
    const { data } = await supabase
      .rpc('search_public_profiles', { _search_term: null, _limit: 100 });
    
    setAllUsers((data || []).map(u => ({
      id: u.id,
      display_name: u.display_name || 'Unknown',
      avatar_url: u.avatar_url,
    })));
  };

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    onChange(newValue);

    // Find if we're in a mention context (after @)
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if there's a space before the @ (or it's at the start)
      const charBeforeAt = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : ' ';
      
      // Only show suggestions if @ is at start or preceded by whitespace
      // and the text after @ doesn't contain a space (not completed mention)
      if ((charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0) && 
          !textAfterAt.includes(' ') && 
          textAfterAt.length <= 30) {
        setMentionStartPos(lastAtIndex);
        setMentionQuery(textAfterAt.toLowerCase());
        setShowSuggestions(true);
        
        // Filter users based on query
        const filtered = allUsers.filter(u => 
          u.display_name.toLowerCase().includes(textAfterAt.toLowerCase())
        ).slice(0, 8);
        setSuggestions(filtered);
        setSelectedIndex(0);
        return;
      }
    }
    
    setShowSuggestions(false);
    setMentionStartPos(null);
  }, [onChange, allUsers]);

  const insertMention = useCallback((user: MentionUser) => {
    if (mentionStartPos === null) return;
    
    const beforeMention = value.slice(0, mentionStartPos);
    const afterMention = value.slice(mentionStartPos + mentionQuery.length + 1);
    const newValue = `${beforeMention}@${user.display_name} ${afterMention}`;
    
    onChange(newValue);
    setShowSuggestions(false);
    setMentionStartPos(null);
    setMentionQuery('');
    
    // Extract all mentioned user IDs
    if (onMentions) {
      const mentionPattern = /@([^\s@]+)/g;
      const mentions: string[] = [];
      let match;
      while ((match = mentionPattern.exec(newValue)) !== null) {
        const mentionedName = match[1];
        const mentionedUser = allUsers.find(
          u => u.display_name.toLowerCase() === mentionedName.toLowerCase()
        );
        if (mentionedUser) {
          mentions.push(mentionedUser.id);
        }
      }
      onMentions([...new Set(mentions)]);
    }
    
    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = beforeMention.length + user.display_name.length + 2;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange, mentionStartPos, mentionQuery, allUsers, onMentions]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        if (showSuggestions && suggestions[selectedIndex]) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
      case 'Tab':
        if (showSuggestions && suggestions[selectedIndex]) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, insertMention]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 bottom-full mb-1 left-0 w-64 bg-popover border border-border rounded-md shadow-lg overflow-hidden"
        >
          <div className="py-1 max-h-48 overflow-y-auto">
            {suggestions.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                  index === selectedIndex ? 'bg-accent' : 'hover:bg-muted'
                }`}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {user.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">{user.display_name}</span>
              </div>
            ))}
          </div>
          <div className="px-3 py-1.5 bg-muted/50 text-xs text-muted-foreground border-t">
            ↑↓ to navigate, Enter to select, Esc to close
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to render comment body with highlighted mentions
export function renderMentions(body: string): React.ReactNode {
  const parts = body.split(/(@[^\s@]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span key={i} className="text-primary font-medium bg-primary/10 rounded px-0.5">
          {part}
        </span>
      );
    }
    return part;
  });
}
