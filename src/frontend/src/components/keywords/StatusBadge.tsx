'use client';

type Status = 'active' | 'paused' | 'failed';

const STYLES: Record<Status, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
};

const LABELS: Record<Status, string> = {
  active: 'Active',
  paused: 'Paused',
  failed: 'Failed',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STYLES[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'active' ? 'bg-green-500' : status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
      }`} />
      {LABELS[status]}
    </span>
  );
}
