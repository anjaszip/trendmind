'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useKeywordDetail } from '@/hooks/useKeywordDetail';
import InsightDetail from '@/components/insights/InsightDetail';
import AccelerationChart from '@/components/insights/AccelerationChart';
import StageTimeline from '@/components/insights/StageTimeline';

const STAGE_COLORS: Record<string, string> = {
  seed: 'bg-gray-100 text-gray-700',
  emerging: 'bg-green-100 text-green-800',
  growing: 'bg-blue-100 text-blue-800',
  viral: 'bg-purple-100 text-purple-800',
  saturated: 'bg-orange-100 text-orange-800',
  declining: 'bg-red-100 text-red-800',
};

function MetricCell({ label, value, unit = '' }: { label: string; value: number | null; unit?: string }) {
  const display = value != null ? `${value.toFixed(2)}${unit}` : '—';
  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-gray-900">{display}</p>
      <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

export default function KeywordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { keyword, history, loading, error } = useKeywordDetail(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading keyword details…</p>
        </div>
      </div>
    );
  }

  if (error || !keyword) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-600">{error ?? 'Keyword not found.'}</p>
        <Link href="/" className="text-blue-600 hover:underline text-sm">← Back to dashboard</Link>
      </div>
    );
  }

  const stageCls = STAGE_COLORS[keyword.lifecycleStage] ?? 'bg-gray-100 text-gray-700';

  return (
    <div className="max-w-4xl mx-auto space-y-5 py-6 px-4">
      {/* Header */}
      <div>
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Dashboard
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">{keyword.term}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{keyword.normalizedForm}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-blue-600">{keyword.predictionScore ?? '—'}</p>
            <p className="text-xs text-gray-500">prediction score</p>
            {keyword.scoreChange != null && (
              <p className={`text-xs font-medium mt-0.5 ${keyword.scoreChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {keyword.scoreChange >= 0 ? '+' : ''}{keyword.scoreChange} vs prev
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${stageCls}`}>
            {keyword.lifecycleStage}
          </span>
          {keyword.confidenceLevel && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {keyword.confidenceLevel} confidence
            </span>
          )}
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${keyword.monitoringStatus === 'active' ? 'bg-green-50 text-green-700' : keyword.monitoringStatus === 'failed' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
            {keyword.monitoringStatus}
          </span>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 pt-4 border-t border-gray-100">
          <MetricCell label="Search Accel" value={keyword.searchAcceleration} />
          <MetricCell label="Videos/day" value={keyword.videoVelocity} />
          <MetricCell label="Creators/day" value={keyword.creatorAdoptionRate} />
          <MetricCell label="Views/day" value={keyword.viewVelocity} />
          <MetricCell label="Related growth" value={keyword.relatedQueryGrowth} />
        </div>

        {keyword.historicalDataDays != null && (
          <p className="text-xs text-gray-400 mt-3 text-center">
            Based on {keyword.historicalDataDays} days of historical data
          </p>
        )}
      </div>

      {/* Two-column layout for timeline + insight */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <StageTimeline
          currentStage={keyword.lifecycleStage}
          stageEnteredAt={keyword.stageEnteredAt}
          transitions={keyword.stageTransitions}
        />
        <InsightDetail
          insightText={keyword.insightText}
          timingRecommendation={keyword.timingRecommendation}
          rapidTransitionFlag={keyword.rapidTransitionFlag}
          seasonalityFlag={keyword.seasonalityFlag}
          confidenceLevel={keyword.confidenceLevel}
        />
      </div>

      {/* Acceleration chart */}
      <AccelerationChart data={history} />
    </div>
  );
}
