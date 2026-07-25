import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/lib/types';

interface MentionState {
  isMentioning: boolean;
  query: string;
  startIndex: number;
  users: UserProfile[];
  selectedIndex: number;
}

export function useMentions(text: string, onSelect: (username: string) => void) {
  const [mentionState, setMentionState] = useState<MentionState>({
    isMentioning: false,
    query: '',
    startIndex: -1,
    users: [],
    selectedIndex: 0,
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Basic mention detection looking for @word at the end of the cursor
    const lastWord = text.split(/\s/).pop() || '';
    if (lastWord.startsWith('@')) {
      const query = lastWord.substring(1);
      const startIndex = text.lastIndexOf('@');
      
      setMentionState(prev => ({
        ...prev,
        isMentioning: true,
        query,
        startIndex,
      }));
    } else {
      setMentionState(prev => ({
        ...prev,
        isMentioning: false,
        query: '',
        startIndex: -1,
        users: [],
      }));
    }
  }, [text]);

  useEffect(() => {
    if (!mentionState.isMentioning) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, role, admin_title, frame_id, level, title')
        .ilike('username', `${mentionState.query}%`)
        .limit(10);

      if (!error && data) {
        setMentionState(prev => ({
          ...prev,
          users: data,
          selectedIndex: 0,
        }));
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [mentionState.query, mentionState.isMentioning]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!mentionState.isMentioning || mentionState.users.length === 0) return false;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionState(prev => ({
        ...prev,
        selectedIndex: (prev.selectedIndex + 1) % prev.users.length
      }));
      return true;
    }
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionState(prev => ({
        ...prev,
        selectedIndex: prev.selectedIndex === 0 ? prev.users.length - 1 : prev.selectedIndex - 1
      }));
      return true;
    }

    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const selectedUser = mentionState.users[mentionState.selectedIndex];
      if (selectedUser) {
        onSelect(selectedUser.username);
        setMentionState(prev => ({ ...prev, isMentioning: false }));
        return true;
      }
    }

    if (e.key === 'Escape') {
      setMentionState(prev => ({ ...prev, isMentioning: false }));
      return true;
    }

    return false;
  }, [mentionState, onSelect]);

  const insertMention = (username: string) => {
    if (mentionState.startIndex === -1) return text;
    const before = text.substring(0, mentionState.startIndex);
    return `${before}@${username} `;
  };

  return {
    mentionState,
    handleKeyDown,
    insertMention,
    setMentionState
  };
}
