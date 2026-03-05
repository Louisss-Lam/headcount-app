'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { Agent, Category } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';
import DraggableAgent from '@/components/DraggableAgent';
import CategoryPot from '@/components/CategoryPot';
import SubmitBar from '@/components/SubmitBar';
import AvatarCard from '@/components/AvatarCard';

type Assignments = Record<Category, Agent[]>;

function emptyAssignments(): Assignments {
  return {
    active: [],
    not_in: [],
    sick: [],
    holiday: [],
    leaver: [],
  };
}

export default function HeadcountPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const managerId = params.managerId as string;

  const [agents, setAgents] = useState<Agent[]>([]);
  const [unassigned, setUnassigned] = useState<Agent[]>([]);
  const [assignments, setAssignments] = useState<Assignments>(emptyAssignments());
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const tokenAuthDone = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  // Auto-authenticate with token from URL (magic link)
  useEffect(() => {
    const token = searchParams.get('token');
    if (!token || tokenAuthDone.current) return;
    tokenAuthDone.current = true;

    fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerId, token }),
    }).then(() => {
      // Strip token from URL for cleanliness
      router.replace(`/headcount/${managerId}`);
    });
  }, [managerId, searchParams, router]);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch(`/api/managers/${managerId}/agents`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setAgents(data.agents);
        setUnassigned(data.agents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agents');
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, [managerId]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const agentId = String(event.active.id).replace('agent-', '');
      const agent = agents.find((a) => a.id === agentId);
      if (agent) setActiveAgent(agent);
    },
    [agents]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveAgent(null);
      const { active, over } = event;
      if (!over) return;

      const agentId = String(active.id).replace('agent-', '');
      const agent = agents.find((a) => a.id === agentId);
      if (!agent) return;

      const targetCategory = String(over.id).replace('category-', '') as Category;
      if (!CATEGORIES[targetCategory]) return;

      // Remove from unassigned
      setUnassigned((prev) => prev.filter((a) => a.id !== agentId));

      // Remove from any existing category
      setAssignments((prev) => {
        const next = { ...prev };
        for (const cat of Object.keys(next) as Category[]) {
          next[cat] = next[cat].filter((a) => a.id !== agentId);
        }
        // Add to target category
        next[targetCategory] = [...next[targetCategory], agent];
        return next;
      });
    },
    [agents]
  );

  const handleRemoveAgent = useCallback((agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    setAssignments((prev) => {
      const next = { ...prev };
      for (const cat of Object.keys(next) as Category[]) {
        next[cat] = next[cat].filter((a) => a.id !== agentId);
      }
      return next;
    });
    setUnassigned((prev) => {
      if (prev.some((a) => a.id === agentId)) return prev;
      return [...prev, agent];
    });
  }, [agents]);

  const assignedCount = Object.values(assignments).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  const categoryCounts = Object.fromEntries(
    (Object.keys(CATEGORIES) as Category[]).map((cat) => [cat, assignments[cat].length])
  ) as Record<Category, number>;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const entries = (Object.keys(assignments) as Category[]).flatMap((category) =>
        assignments[category].map((agent) => ({
          agentId: agent.id,
          category,
        }))
      );

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerId,
          entries,
          recipientEmail: recipientEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading agents...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="inline-block p-6 bg-green-50 border border-green-200 rounded-xl">
          <h2 className="text-2xl font-bold text-green-800 mb-2">Headcount Submitted!</h2>
          <p className="text-green-700">Your team&apos;s headcount has been recorded successfully. You can close this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Assign Headcount</h1>

      {/* Email recipient */}
      <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
        <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 mb-1">
          Send report to
        </label>
        <input
          id="recipientEmail"
          type="email"
          placeholder="e.g. manager@company.com"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          className="w-full sm:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {!recipientEmail.trim() && (
          <p className="mt-1 text-xs text-gray-400">Leave empty to skip emailing the report.</p>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Unassigned agents */}
        {unassigned.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Unassigned ({unassigned.length})
            </h2>
            <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border border-gray-200 min-h-[100px]">
              {unassigned.map((agent, i) => (
                <DraggableAgent
                  key={agent.id}
                  id={agent.id}
                  name={agent.full_name}
                  seed={agent.avatar_seed}
                  animationDelay={i * 0.2}
                />
              ))}
            </div>
          </div>
        )}

        {/* Category pots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {(Object.keys(CATEGORIES) as Category[]).map((category) => (
            <CategoryPot
              key={category}
              category={category}
              agents={assignments[category]}
              onRemoveAgent={handleRemoveAgent}
            />
          ))}
        </div>

        {/* Drag overlay for smooth visuals */}
        <DragOverlay>
          {activeAgent ? (
            <AvatarCard name={activeAgent.full_name} seed={activeAgent.avatar_seed} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <SubmitBar
        categoryCounts={categoryCounts}
        totalAgents={agents.length}
        assignedCount={assignedCount}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
