"use client";

import { useState, useEffect } from 'react';

interface Suggestion {
  id: string;
  title: string;
  japaneseTitle?: string;
  poster: string;
  metadata: string;
}

export function useSatoruSuggest(query: string) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Mission abort if query is too short
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    // 2. Tactical Debounce: Wait 300ms after last keystroke
    const handler = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/shadow/satoru?action=suggest&q=${encodeURIComponent(query)}`);
        const result = await response.json();

        if (result.success) {
          setSuggestions(result.data);
        } else {
          setError("Intelligence retrieval failed.");
        }
      } catch (err) {
        setError("Network intercepted.");
      } finally {
        setIsLoading(false);
      }
    }, 300);

    // 3. Cleanup: Clear timeout if query changes before 300ms
    return () => clearTimeout(handler);
  }, [query]);

  return { suggestions, isLoading, error };
}