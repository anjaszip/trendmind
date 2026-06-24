'use client';

const TIMING_CONFIG: Record<string, { label: string; className: string }> = {
  early: { label: 'Early opportunity', className: 'bg-green-100 text-green-800' },
  on_time: { label: 'Right timing', className: 'bg-blue-100 text-blue-800' },
  late: { label: 'Late entry', className: 'bg-orange-100 text-orange-800' },
  avoid: { label: 'Avoid — declining', className: 'bg-red-100 text-red-800' },
};

interface InsightDetailProps {
  insightText: string | null;
  timingRecommendation: string | null;
  rapidTransitionFlag: boolean;
  seasonalityFlag: boolean;
  confidenceLevel: string | null;
}

export default function InsightDetail({
  insightText,
  timingRecommendation,
  rapidTransitionFlag,
  seasonalityFlag,
  confidenceLevel,
}: InsightDetailProps) {
  const timing = timingRecommendation ? TIMING_CONFIG[timingRecommendation] : null;

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-3">AI Insight</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {timing && (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${timing.className}`}>
            {timing.label}
          </span>
        )}
        {confidenceLevel && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {confidenceLevel} confidence
          </span>
        )}
      </div>

      {rapidTransitionFlag && (
        <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
          <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
          <span>Rapid stage transition detected — opportunity window may be closing faster than normal.</span>
        </div>
      )}

      {seasonalityFlag && (
        <div className="mb-3 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800">
          <span className="shrink-0">📅</span>
          <span>Seasonal pattern detected — growth may repeat at regular intervals.</span>
        </div>
      )}

      {insightText ? (
        <p className="text-sm text-gray-700 leading-relaxed">{insightText}</p>
      ) : (
        <p className="text-sm text-gray-400 italic">No insight available yet — check back after 7+ days of data.</p>
      )}
    </section>
  );
}
