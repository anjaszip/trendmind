'use client';

import { useState } from 'react';
import { useEmergingOpportunities } from '../hooks/useDashboard';
import { OpportunityCard } from '../components/dashboard/OpportunityCard';
import LoadingState from '../components/common/LoadingState';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { KeywordList } from '../components/keywords/KeywordList';

const STAGE_OPTIONS = [
  { value: 'seed', label: 'Seed' },
  { value: 'emerging', label: 'Emerging' },
  { value: 'growing', label: 'Growing' },
  { value: 'viral', label: 'Viral' },
];

const CONFIDENCE_OPTIONS = [
  { value: '', label: 'Any confidence' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function DashboardPage() {
  const [selectedStages, setSelectedStages] = useState<string[]>(['seed', 'emerging']);
  const [minScore, setMinScore] = useState<number>(0);
  const [confidenceLevel, setConfidenceLevel] = useState<string>('');

  const { opportunities, stageDistribution, loading, error, refetch } = useEmergingOpportunities({
    stages: selectedStages,
    minScore,
    confidenceLevel: confidenceLevel || undefined,
    limit: 10,
  });

  function toggleStage(stage: string): void {
    setSelectedStages((prev: string[]) =>
      prev.includes(stage) ? prev.filter((s: string) => s !== stage) : [...prev, stage],
    );
  }

  return (
    <ErrorBoundary>
      {stageDistribution.length > 0 && (
        <div className="flex gap-3 mb-6 flex-wrap">
          {stageDistribution.map((d) => (
            <div key={d.stage} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <strong className="capitalize">{d.stage}</strong>
              <span className="text-gray-500 ml-1">{d.count} ({d.percentage}%)</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex gap-5 flex-wrap items-center">
        <div>
          <p className="text-xs text-gray-500 mb-2">Lifecycle stages</p>
          <div className="flex gap-2">
            {STAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleStage(opt.value)}
                className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                  selectedStages.includes(opt.value)
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">Min score: {minScore}</p>
          <input
            type="range" min={0} max={100} step={5} value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-32"
          />
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">Confidence</p>
          <select
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(e.target.value)}
            className="px-2 py-1 border border-gray-200 rounded-md text-sm"
          >
            {CONFIDENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={refetch}
          className="ml-auto px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? (
            <LoadingState message="Loading emerging opportunities..." />
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="mb-2">No emerging opportunities found.</p>
              <p className="text-sm">Seed keywords are being monitored — check back in a few hours.</p>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {opportunities.map((op) => (
                <OpportunityCard key={op.keywordId} opportunity={op} />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <KeywordList />
        </div>
      </div>
    </ErrorBoundary>
  );
}
