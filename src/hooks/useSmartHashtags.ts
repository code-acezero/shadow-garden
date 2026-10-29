import { useState, useEffect, useMemo, useCallback } from 'react';
import { SmartHashtagItem } from '@/components/ui/HashtagDropdown';
import { playGummyPop } from '@/lib/audioManager';

const STORAGE_KEY = 'shadow_user_hashtags_v1';

export const CURATED_POPULAR_HASHTAGS: SmartHashtagItem[] = [
  { tag: '#AnimeDiscussion', label: 'AnimeDiscussion', type: 'popular', countText: 'Popular' },
  { tag: '#SoloLeveling', label: 'SoloLeveling', type: 'trending', countText: 'Trending' },
  { tag: '#Theory', label: 'Theory', type: 'popular', countText: 'Popular' },
  { tag: '#FanArt', label: 'FanArt', type: 'popular', countText: 'Popular' },
  { tag: '#PeakFiction', label: 'PeakFiction', type: 'trending', countText: 'Trending' },
  { tag: '#JujutsuKaisen', label: 'JujutsuKaisen', type: 'trending', countText: 'Trending' },
  { tag: '#BleachTYBW', label: 'BleachTYBW', type: 'trending', countText: 'Trending' },
  { tag: '#EminenceInShadow', label: 'EminenceInShadow', type: 'trending', countText: 'Trending' },
  { tag: '#Review', label: 'Review', type: 'popular', countText: 'Popular' },
  { tag: '#DemonSlayer', label: 'DemonSlayer', type: 'trending', countText: 'Trending' },
  { tag: '#Frieren', label: 'Frieren', type: 'trending', countText: 'Trending' },
  { tag: '#Manga', label: 'Manga', type: 'popular', countText: 'Popular' },
  { tag: '#Manhwa', label: 'Manhwa', type: 'popular', countText: 'Popular' },
  { tag: '#OnePiece', label: 'OnePiece', type: 'trending', countText: 'Trending' },
  { tag: '#AnimeArt', label: 'AnimeArt', type: 'popular', countText: 'Popular' },
  { tag: '#AnimeEdit', label: 'AnimeEdit', type: 'popular', countText: 'Popular' },
  { tag: '#Cosplay', label: 'Cosplay', type: 'popular', countText: 'Popular' },
  { tag: '#Recommendations', label: 'Recommendations', type: 'popular', countText: 'Popular' }
];

export function cleanAnimeToHashtag(title: string | undefined): SmartHashtagItem | null {
  if (!title) return null;
  // Clean title: remove subtitle after colon or hyphen, clean special chars
  const mainTitle = title.split(/[:\-–—]/)[0] || title;
  const cleaned = mainTitle
    .replace(/\b(season|part|cour|the|movie|tv|ova|ona)\b/gi, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map(w => (w.length <= 4 && w === w.toUpperCase()) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');

  if (!cleaned) return null;
  return {
    tag: `#${cleaned}`,
    label: cleaned,
    type: 'context',
    countText: 'Attached Anime'
  };
}

export function useSmartHashtags({
  content,
  setContent,
  attachedAnimeTitle
}: {
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  attachedAnimeTitle?: string;
}) {
  const [storedData, setStoredData] = useState<{ recents: string[]; counts: Record<string, number> }>({
    recents: [],
    counts: {}
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setStoredData({
          recents: Array.isArray(parsed.recents) ? parsed.recents : [],
          counts: typeof parsed.counts === 'object' && parsed.counts ? parsed.counts : {}
        });
      }
    } catch (e) {
      console.warn('Failed to load hashtags from localStorage', e);
    }
  }, []);

  // Save tag to localStorage
  const recordHashtag = useCallback((rawTag: string) => {
    if (!rawTag) return;
    const cleanTag = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
    setStoredData(prev => {
      const nextCounts = { ...prev.counts, [cleanTag]: (prev.counts[cleanTag] || 0) + 1 };
      const nextRecents = [
        cleanTag,
        ...prev.recents.filter(t => t.toLowerCase() !== cleanTag.toLowerCase())
      ].slice(0, 15);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ recents: nextRecents, counts: nextCounts }));
        } catch (e) {
          console.warn('Failed to save hashtag to localStorage', e);
        }
      }

      return { recents: nextRecents, counts: nextCounts };
    });
  }, []);

  // Record all hashtags from published content
  const recordAllFromContent = useCallback((text: string) => {
    if (!text) return;
    const matches = text.match(/#[a-zA-Z0-9_\u0590-\u05ff]+/g);
    if (matches) {
      matches.forEach(tag => recordHashtag(tag));
    }
  }, [recordHashtag]);

  // Check if cursor/text is currently typing a hashtag
  const hashtagMatch = useMemo(() => {
    return content.match(/(?:^|\s)#([a-zA-Z0-9_\u0590-\u05ff]*)$/);
  }, [content]);

  const isTypingHashtag = !!hashtagMatch;
  const activeQuery = hashtagMatch ? hashtagMatch[1].toLowerCase() : '';

  // Contextual tag from attached anime
  const contextualTag = useMemo(() => {
    return cleanAnimeToHashtag(attachedAnimeTitle);
  }, [attachedAnimeTitle]);

  // Combined Master Hashtag Pool
  const allCandidateTags = useMemo(() => {
    const list: SmartHashtagItem[] = [];
    const seen = new Set<string>();

    const pushTag = (item: SmartHashtagItem) => {
      const lower = item.tag.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        list.push(item);
      }
    };

    // 1. Attached anime contextual tag first
    if (contextualTag) {
      pushTag(contextualTag);
    }

    // 2. User recents and most used
    storedData.recents.forEach(tag => {
      const count = storedData.counts[tag] || 1;
      pushTag({
        tag,
        label: tag.replace('#', ''),
        type: 'recent',
        countText: count > 1 ? `${count} uses` : 'Recent'
      });
    });

    // 3. Trending & Popular Curated Anime Tags
    CURATED_POPULAR_HASHTAGS.forEach(item => {
      pushTag(item);
    });

    return list;
  }, [contextualTag, storedData]);

  // Filtered Smart Suggestions
  const suggestions = useMemo(() => {
    if (!isTypingHashtag || !activeQuery) {
      // Return top priority suggestions (context, recent, trending)
      return allCandidateTags.slice(0, 8);
    }

    const filtered = allCandidateTags.filter(item => {
      const pure = item.tag.toLowerCase().replace('#', '');
      return pure.includes(activeQuery);
    });

    // Sort by best match (starts with first, then recent, then trending)
    filtered.sort((a, b) => {
      const aStarts = a.tag.toLowerCase().startsWith(`#${activeQuery}`);
      const bStarts = b.tag.toLowerCase().startsWith(`#${activeQuery}`);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      if (a.type === 'recent' && b.type !== 'recent') return -1;
      if (a.type !== 'recent' && b.type === 'recent') return 1;

      return 0;
    });

    // If query is typed and not an exact match, append as "New hashtag" option
    if (activeQuery.length >= 2 && !filtered.some(t => t.tag.toLowerCase() === `#${activeQuery}`)) {
      filtered.push({
        tag: `#${activeQuery}`,
        label: activeQuery,
        type: 'popular',
        countText: 'New hashtag'
      });
    }

    return filtered.slice(0, 8);
  }, [allCandidateTags, isTypingHashtag, activeQuery]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [activeQuery]);

  // Select Hashtag Handler
  const selectHashtag = useCallback((tag: string) => {
    playGummyPop(0.2);
    recordHashtag(tag);

    setContent(prev => {
      if (/(?:^|\s)#([a-zA-Z0-9_\u0590-\u05ff]*)$/.test(prev)) {
        return prev.replace(/(?:^|\s)#([a-zA-Z0-9_\u0590-\u05ff]*)$/, (match) => {
          const leadingSpace = match.startsWith(' ') ? ' ' : '';
          return `${leadingSpace}${tag} `;
        });
      }
      return (prev.endsWith(' ') || prev === '' ? prev : prev + ' ') + tag + ' ';
    });

    // Refocus composer input
    setTimeout(() => {
      const el = document.getElementById('composer-input');
      if (el) {
        el.focus();
      }
    }, 10);
  }, [recordHashtag, setContent]);

  // Keyboard Navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isTypingHashtag || suggestions.length === 0) return false;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
      return true;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (suggestions[selectedIndex]) {
        e.preventDefault();
        selectHashtag(suggestions[selectedIndex].tag);
        return true;
      }
    }
    if (e.key === 'Escape') {
      return true;
    }
    return false;
  }, [isTypingHashtag, suggestions, selectedIndex, selectHashtag]);

  return {
    isTypingHashtag,
    activeQuery,
    suggestions,
    selectedIndex,
    allCandidateTags,
    selectHashtag,
    handleKeyDown,
    recordAllFromContent
  };
}
