'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface KeywordItem {
  id: string;
  term: string;
  normalizedForm: string;
  lifecycleStage: string;
  monitoringStatus: 'active' | 'paused' | 'failed';
  isSeedKeyword: boolean;
  createdAt: string;
  lastCollectedAt: string | null;
}

interface UseKeywordsResult {
  keywords: KeywordItem[];
  loading: boolean;
  error: string | null;
  addKeyword: (term: string) => Promise<void>;
  removeKeyword: (id: string) => Promise<void>;
  refetch: () => void;
}

export function useKeywords(): UseKeywordsResult {
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeywords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<KeywordItem[]>('/keywords');
      setKeywords(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load keywords');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchKeywords(); }, [fetchKeywords]);

  const addKeyword = useCallback(async (term: string): Promise<void> => {
    const res = await api.post<KeywordItem>('/keywords', { term });
    setKeywords((prev: KeywordItem[]) => [res.data, ...prev]);
  }, []);

  const removeKeyword = useCallback(async (id: string): Promise<void> => {
    await api.delete(`/keywords/${id}`);
    setKeywords((prev: KeywordItem[]) => prev.filter((k: KeywordItem) => k.id !== id));
  }, []);

  return { keywords, loading, error, addKeyword, removeKeyword, refetch: fetchKeywords };
}
