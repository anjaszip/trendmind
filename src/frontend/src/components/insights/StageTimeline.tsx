'use client';

import type { StageTransition } from '@/hooks/useKeywordDetail';

const STAGE_ORDER = ['seed', 'emerging', 'growing', 'viral', 'saturated', 'declining'];

const STAGE_COLORS: Record<string, string> = {
  seed: 'bg-gray-200 text-gray-700',
  emerging: 'bg-green-100 text-green-800',
  growing: 'bg-blue-100 text-blue-800',
  viral: 'bg-purple-100 text-purple-800',
  saturated: 'bg-orange-100 text-orange-800',
  declining: 'bg-red-100 text-red-800',
};

const STAGE_DOT: Record<string, string> = {
  seed: 'bg-gray-400',
  emerging: 'bg-green-500',
  growing: 'bg-blue-500',
  viral: 'bg-purple-500',
  saturated: 'bg-orange-500',
  declining: 'bg-red-500',
};

const VELOCITY_LABELS: Record<string, { text: string; className: string }> = {
  rapid: { text: 'Rapid', className: 'text-amber-600' },
  normal: { text: 'Normal', className: 'text-gray-500' },
  stagnant: { text: 'Slow', className: 'text-gray-400' },
};

interface StageTimelineProps {
  currentStage: string;
  stageEnteredAt: string;
  transitions: StageTransition[];
}

export default function StageTimeline({ currentStage, stageEnteredAt, transitions }: StageTimelineProps) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const mainStages = STAGE_ORDER.slice(0, 4); // seed → emerging → growing → viral

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Lifecycle Stage</h2>

      {/* Stage progression bar */}
      <div className="flex items-center gap-0 mb-6">
        {mainStages.map((stage, i) => {
          const isActive = stage === currentStage;
          const isPast = STAGE_ORDER.indexOf(stage) < currentIndex;
          const dotColor = isActive ? STAGE_DOT[stage] : isPast ? 'bg-gray-300' : 'bg-gray-100 border border-gray-200';

          return (
            <div key={stage} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${dotColor} ${isActive ? 'ring-2 ring-offset-1 ring-current' : ''}`} />
                <span className={`mt-1 text-xs font-medium capitalize ${isActive ? 'text-gray-900' : isPast ? 'text-gray-400' : 'text-gray-300'}`}>
                  {stage}
                </span>
              </div>
              {i < mainStages.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${isPast || isActive ? 'bg-gray-300' : 'bg-gray-100'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current stage badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${STAGE_COLORS[currentStage] ?? 'bg-gray-100 text-gray-600'}`}>
          {currentStage}
        </span>
        <span className="text-xs text-gray-500">
          since {new Date(stageEnteredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Transition history */}
      {transitions.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Transition history</h3>
          <ul className="space-y-2">
            {transitions.map((t) => {
              const vel = VELOCITY_LABELS[t.transitionVelocity];
              return (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    <span className="capitalize">{t.previousStage}</span>
                    <span className="mx-1.5 text-gray-400">→</span>
                    <span className="capitalize font-medium">{t.newStage}</span>
                  </span>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {vel && <span className={vel.className}>{vel.text}</span>}
                    <span>{t.daysInPreviousStage}d in stage</span>
                    <span>{new Date(t.transitionTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {transitions.length === 0 && (
        <p className="text-xs text-gray-400 italic">No stage transitions yet.</p>
      )}
    </section>
  );
}
