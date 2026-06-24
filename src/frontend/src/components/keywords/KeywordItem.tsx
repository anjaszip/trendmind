'use client';

import { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import type { KeywordItem as KeywordItemData } from '../../hooks/useKeywords';

const STAGE_COLORS: Record<string, string> = {
  seed: 'text-gray-500',
  emerging: 'text-green-600',
  growing: 'text-blue-600',
  viral: 'text-purple-600',
  saturated: 'text-orange-600',
  declining: 'text-red-600',
};

interface Props {
  keyword: KeywordItemData;
  onRemove: (id: string) => Promise<void>;
}

export function KeywordItem({ keyword, onRemove }: Props) {
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    try {
      await onRemove(keyword.id);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{keyword.term}</p>
          <p className={`text-xs capitalize mt-0.5 ${STAGE_COLORS[keyword.lifecycleStage] ?? 'text-gray-500'}`}>
            {keyword.lifecycleStage}
          </p>
        </div>
        <StatusBadge status={keyword.monitoringStatus} />
      </div>

      {!keyword.isSeedKeyword && (
        <button
          onClick={handleRemove}
          disabled={removing}
          className="ml-4 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 flex-shrink-0"
          aria-label={`Remove ${keyword.term}`}
        >
          {removing ? (
            <span className="text-xs">…</span>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
