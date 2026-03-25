'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Agent, Category } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';
import AvatarCard from './AvatarCard';
import { createAvatar } from '@dicebear/core';
import { funEmoji } from '@dicebear/collection';

type Assignments = Record<Category, Agent[]>;

interface HistoryEntry {
  agentId: string;
  previousCategory: Category | null;
  newCategory: Category;
}

const CATEGORY_COLORS: Record<Category, string> = {
  active: 'bg-green-500',
  not_in: 'bg-orange-500',
  sick: 'bg-red-500',
  holiday: 'bg-blue-500',
  leaver: 'bg-purple-500',
};

const CATEGORY_BTN_STYLES: Record<Category, string> = {
  active: 'bg-green-50 border-green-300 text-green-800 active:bg-green-200',
  not_in: 'bg-orange-50 border-orange-300 text-orange-800 active:bg-orange-200',
  sick: 'bg-red-50 border-red-300 text-red-800 active:bg-red-200',
  holiday: 'bg-blue-50 border-blue-300 text-blue-800 active:bg-blue-200',
  leaver: 'bg-purple-50 border-purple-300 text-purple-800 active:bg-purple-200',
};

interface MobileHeadcountProps {
  agents: Agent[];
  assignments: Assignments;
  onAssign: (agent: Agent, category: Category) => void;
  onUnassign: (agentId: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

function findAgentCategory(agent: Agent, assignments: Assignments): Category | null {
  for (const cat of Object.keys(assignments) as Category[]) {
    if (assignments[cat].some((a) => a.id === agent.id)) return cat;
  }
  return null;
}

function MiniAvatar({ seed, name }: { seed: string; name: string }) {
  const uri = useMemo(() => {
    return createAvatar(funEmoji, {
      seed,
      size: 32,
      mouth: ['lilSmile', 'cute', 'wideSmile', 'smileTeeth', 'smileLol', 'tongueOut', 'kissHeart'],
      eyes: ['wink', 'cute', 'love', 'wink2', 'glasses', 'stars'],
    }).toDataUri();
  }, [seed]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={uri} alt={name} width={32} height={32} className="rounded-full" title={name} />
  );
}

export default function MobileHeadcount({
  agents,
  assignments,
  onAssign,
  onUnassign,
  onSubmit,
  isSubmitting,
}: MobileHeadcountProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'assign' | 'summary'>('assign');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');

  const totalAgents = agents.length;
  const currentAgent = agents[currentIndex] ?? null;

  const assignedCount = Object.values(assignments).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  const currentCategory = currentAgent ? findAgentCategory(currentAgent, assignments) : null;

  const advance = useCallback(() => {
    if (currentIndex < totalAgents - 1) {
      setSlideDirection('right');
      setCurrentIndex((i) => i + 1);
    } else {
      setPhase('summary');
    }
  }, [currentIndex, totalAgents]);

  const handleCategoryTap = useCallback(
    (category: Category) => {
      if (!currentAgent) return;
      const prevCat = findAgentCategory(currentAgent, assignments);

      // If tapping same category, treat as no-op and just advance
      if (prevCat === category) {
        advance();
        return;
      }

      setHistory((h) => [
        ...h,
        { agentId: currentAgent.id, previousCategory: prevCat, newCategory: category },
      ]);

      onAssign(currentAgent, category);
      advance();
    },
    [currentAgent, assignments, onAssign, advance]
  );

  const handleBack = useCallback(() => {
    if (phase === 'summary') {
      setPhase('assign');
      setCurrentIndex(totalAgents - 1);
      return;
    }

    if (history.length > 0) {
      const last = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));

      // Find the agent that was assigned
      const agentIndex = agents.findIndex((a) => a.id === last.agentId);
      if (agentIndex !== -1) {
        // Undo the assignment
        if (last.previousCategory) {
          onAssign(agents[agentIndex], last.previousCategory);
        } else {
          onUnassign(last.agentId);
        }
        setSlideDirection('left');
        setCurrentIndex(agentIndex);
      }
    } else if (currentIndex > 0) {
      setSlideDirection('left');
      setCurrentIndex((i) => i - 1);
    }
  }, [phase, history, currentIndex, agents, totalAgents, onAssign, onUnassign]);

  const handleSkip = useCallback(() => {
    advance();
  }, [advance]);

  // --- Summary phase ---
  if (phase === 'summary') {
    const unassignedAgents = agents.filter(
      (a) => !findAgentCategory(a, assignments)
    );

    return (
      <div className="px-4 pb-8">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Summary</h1>

        {(Object.keys(CATEGORIES) as Category[]).map((cat) => {
          const catAgents = assignments[cat];
          if (catAgents.length === 0) return null;
          return (
            <div key={cat} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[cat]}`} />
                <span className="font-semibold text-gray-800">
                  {CATEGORIES[cat].label} ({catAgents.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pl-5">
                {catAgents.map((a) => (
                  <div key={a.id} className="flex items-center gap-1.5 bg-white rounded-full px-2 py-1 border border-gray-200 text-xs">
                    <MiniAvatar seed={a.avatar_seed} name={a.full_name} />
                    <span className="text-gray-700">{a.full_name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {unassignedAgents.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <span className="font-semibold text-yellow-800">
              Unassigned ({unassignedAgents.length})
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {unassignedAgents.map((a) => (
                <div key={a.id} className="flex items-center gap-1.5 bg-white rounded-full px-2 py-1 border border-yellow-300 text-xs">
                  <MiniAvatar seed={a.avatar_seed} name={a.full_name} />
                  <span className="text-yellow-800">{a.full_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={onSubmit}
          disabled={isSubmitting || assignedCount === 0}
          className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 active:bg-blue-700 transition-colors"
        >
          {isSubmitting ? 'Submitting...' : `Submit Headcount (${assignedCount}/${totalAgents})`}
        </button>

        <button
          onClick={handleBack}
          className="w-full mt-3 py-2 text-sm text-blue-600 underline"
        >
          Go back and edit
        </button>
      </div>
    );
  }

  // --- Assign phase ---
  if (!currentAgent) return null;

  return (
    <div className="px-4 pb-8 flex flex-col min-h-[calc(100dvh-4rem)]">
      {/* Progress bar */}
      <div className="mb-1">
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
          {(Object.keys(CATEGORIES) as Category[]).map((cat) => {
            const pct = totalAgents > 0 ? (assignments[cat].length / totalAgents) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={cat}
                className={`${CATEGORY_COLORS[cat]} transition-all duration-300`}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-1 text-center">
          {assignedCount} of {totalAgents} assigned
        </p>
      </div>

      {/* Agent card */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div
          key={currentAgent.id}
          className={`${slideDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}
        >
          <AvatarCard
            name={currentAgent.full_name}
            seed={currentAgent.avatar_seed}
            size={128}
            nameClass="text-base font-semibold text-gray-800 text-center mt-1"
          />
        </div>

        {currentCategory && (
          <div className={`mt-2 text-xs px-3 py-1 rounded-full border ${CATEGORY_BTN_STYLES[currentCategory]}`}>
            Currently: {CATEGORIES[currentCategory].label}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">
          {currentIndex + 1} / {totalAgents}
        </p>
      </div>

      {/* Category buttons */}
      <div className="mt-4">
        <div className="grid grid-cols-3 gap-2 mb-2">
          {(['active', 'not_in', 'sick'] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryTap(cat)}
              className={`py-3 px-2 rounded-xl border-2 font-semibold text-sm transition-colors ${CATEGORY_BTN_STYLES[cat]} ${
                currentCategory === cat ? 'ring-2 ring-offset-1 ring-gray-400' : ''
              }`}
            >
              {CATEGORIES[cat].label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(['holiday', 'leaver'] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryTap(cat)}
              className={`py-3 px-2 rounded-xl border-2 font-semibold text-sm transition-colors ${CATEGORY_BTN_STYLES[cat]} ${
                currentCategory === cat ? 'ring-2 ring-offset-1 ring-gray-400' : ''
              }`}
            >
              {CATEGORIES[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Nav buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleBack}
          disabled={currentIndex === 0 && history.length === 0}
          className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-medium text-sm disabled:opacity-30 active:bg-gray-100 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSkip}
          className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-medium text-sm active:bg-gray-100 transition-colors"
        >
          {currentIndex < totalAgents - 1 ? 'Skip' : 'Review'}
        </button>
      </div>
    </div>
  );
}
