'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

export interface StageTransition {
  id: string;
  previousStage: string;
  newStage: string;
  transitionTimestamp: string;
  transitionVelocity: 'rapid' | 'normal' | 'stagnant';
  daysInPreviousStage: number;
  accelerationAtTransition: number | null;
  triggerSignals: string[];
}

export interface AccelerationPoint {
  id: string;
  keywordId: string;
  calculationTimestamp: string;
  searchAcceleration: number | null;
  videoVelocity: number | null;
  creatorAdoptionRate: number | null;
  viewVelocity: number | null;
  relatedQueryGrowth: number | null;
  confidenceLevel: string;
  historicalDataDays: number;
}

export interface KeywordDetail {
  id: string;
  term: string;
  normalizedForm: string;
  lifecycleStage: string;
  monitoringStatus: 'active' | 'paused' | 'failed';
  isSeedKeyword: boolean;
  createdAt: string;
  lastCollectedAt: string | null;
  stageEnteredAt: string;
  predictionScore: number | null;
  confidenceLevel: string | null;
  scoreChange: number | null;
  searchAccelerationComponent: number | null;
  videoVelocityComponent: number | null;
  creatorAdoptionComponent: number | null;
  searchAcceleration: number | null;
  videoVelocity: number | null;
  creatorAdoptionRate: number | null;
  viewVelocity: number | null;
  relatedQueryGrowth: number | null;
  historicalDataDays: number | null;
  insightText: string | null;
  timingRecommendation: string | null;
  rapidTransitionFlag: boolean;
  seasonalityFlag: boolean;
  stageTransitions: StageTransition[];
}

interface UseKeywordDetailResult {
  keyword: KeywordDetail | null;
  history: AccelerationPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useKeywordDetail(id: string): UseKeywordDetailResult {
  const [keyword, setKeyword] = useState<KeywordDetail | null>(null);
  const [history, setHistory] = useState<AccelerationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [detailRes, historyRes] = await Promise.all([
        api.get<KeywordDetail>(`/keywords/${id}`),
        api.get<AccelerationPoint[]>(`/keywords/${id}/acceleration-history?days=30`),
      ]);
      setKeyword(detailRes.data);
      setHistory(historyRes.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Failed to load keyword details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { keyword, history, loading, error, refetch: fetchData };
}
