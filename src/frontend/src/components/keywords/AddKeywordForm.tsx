'use client';

import { useState, FormEvent } from 'react';
import { useToast } from '../common/Toast';

interface Props {
  onAdd: (term: string) => Promise<void>;
}

export function AddKeywordForm({ onAdd }: Props) {
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const toast = useToast();

  function validate(value: string): string | null {
    if (!value.trim()) return 'Keyword is required';
    if (value.length > 100) return 'Keyword must be 100 characters or less';
    if (/[<>'"`;\\]/.test(value)) return 'Keyword contains invalid characters';
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const error = validate(term);
    if (error) { setFieldError(error); return; }

    setFieldError(null);
    setLoading(true);
    try {
      await onAdd(term.trim());
      setTerm('');
      toast.show(`"${term.trim()}" added to monitoring`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add keyword';
      const isConflict = msg.toLowerCase().includes('already') || msg.includes('409');
      toast.show(isConflict ? `Already monitoring "${term.trim()}"` : msg, isConflict ? 'warning' : 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2" noValidate>
      <div className="flex-1">
        <input
          type="text"
          value={term}
          onChange={(e) => { setTerm(e.target.value); setFieldError(null); }}
          placeholder="e.g. portable blender"
          maxLength={100}
          disabled={loading}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            fieldError ? 'border-red-400' : 'border-gray-200'
          }`}
          aria-label="Keyword to monitor"
        />
        {fieldError && <p className="text-xs text-red-500 mt-1">{fieldError}</p>}
      </div>
      <button
        type="submit"
        disabled={loading || !term.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
      >
        {loading ? 'Adding…' : 'Add keyword'}
      </button>
    </form>
  );
}
