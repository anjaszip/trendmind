'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Opportunity } from '../components/dashboard/OpportunityCard';

interface OpportunityFilters {
  stages?: string[];
  minScore?: number;
  confidenceLevel?: string;
  limit?: number;
}

interface StageDistributionItem {
  stage: string;
  count: number;
  percentage: number;
}

interface UseDashboardResult {
  opportunities: Opportunity[];
  stageDistribution: StageDistributionItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEmergingOpportunities(filters: OpportunityFilters = {}): UseDashboardResult {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stageDistribution, setStageDistribution] = useState<StageDistributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.stages?.length) params.set('stages', filters.stages.join(','));
    if (filters.minScore != null) params.set('minScore', String(filters.minScore));
    if (filters.confidenceLevel) params.set('confidenceLevel', filters.confidenceLevel);
    if (filters.limit != null) params.set('limit', String(filters.limit));

    try {
      const [oppRes, distRes] = await Promise.all([
        api.get<Opportunity[]>(`/dashboard/emerging-opportunities?${params.toString()}`),
        api.get<StageDistributionItem[]>('/analytics/stage-distribution'),
      ]);
      setOpportunities(oppRes.data);
      setStageDistribution(distRes.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters.stages?.join(','), filters.minScore, filters.confidenceLevel, filters.limit]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { opportunities, stageDistribution, loading, error, refetch: fetchData };
}
