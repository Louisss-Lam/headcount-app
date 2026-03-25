'use client';

import { CATEGORIES, type Category } from '@/lib/types';

interface SubmitBarProps {
  categoryCounts: Record<Category, number>;
  totalAgents: number;
  assignedCount: number;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function SubmitBar({
  categoryCounts,
  totalAgents,
  assignedCount,
  onSubmit,
  isSubmitting,
}: SubmitBarProps) {
  const allAssigned = assignedCount === totalAgents && totalAgents > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-6 py-3 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex gap-4 flex-wrap">
          {(Object.keys(CATEGORIES) as Category[]).map((cat) => {
            const meta = CATEGORIES[cat];
            return (
              <span key={cat} className={`text-sm font-medium ${meta.color}`}>
                {meta.label}: {categoryCounts[cat]}
              </span>
            );
          })}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {assignedCount} / {totalAgents} assigned
          </span>
          <button
            onClick={onSubmit}
            disabled={!allAssigned || isSubmitting}
            className={`px-6 py-2 rounded-lg font-medium text-white transition-all ${
              allAssigned && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 shadow-md'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Headcount'}
          </button>
        </div>
      </div>
    </div>
  );
}
