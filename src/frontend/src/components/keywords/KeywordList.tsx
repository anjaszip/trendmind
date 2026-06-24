'use client';

import { KeywordItem } from './KeywordItem';
import { AddKeywordForm } from './AddKeywordForm';
import { useKeywords } from '../../hooks/useKeywords';
import LoadingState from '../common/LoadingState';

export function KeywordList() {
  const { keywords, loading, error, addKeyword, removeKeyword } = useKeywords();

  const userKeywords = keywords.filter((k) => !k.isSeedKeyword);

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-1">My Keywords</h2>
        <p className="text-xs text-gray-500">Track specific products — we monitor trends and alert you to lifecycle changes.</p>
      </div>

      <div className="mb-4">
        <AddKeywordForm onAdd={addKeyword} />
      </div>

      {loading ? (
        <LoadingState message="Loading keywords..." />
      ) : error ? (
        <p className="text-sm text-red-600 py-4">{error}</p>
      ) : userKeywords.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          No custom keywords yet. Add one above to start monitoring.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {userKeywords.map((kw) => (
            <KeywordItem key={kw.id} keyword={kw} onRemove={removeKeyword} />
          ))}
        </div>
      )}

      {userKeywords.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right">
          {userKeywords.length} keyword{userKeywords.length !== 1 ? 's' : ''} monitored
        </p>
      )}
    </section>
  );
}
