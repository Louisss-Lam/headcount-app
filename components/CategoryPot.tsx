'use client';

import { useDroppable } from '@dnd-kit/core';
import { CATEGORIES, type Category } from '@/lib/types';
import DraggableAgent from './DraggableAgent';

interface AssignedAgent {
  id: string;
  full_name: string;
  avatar_seed: string;
}

interface CategoryPotProps {
  category: Category;
  agents: AssignedAgent[];
  onRemoveAgent?: (agentId: string) => void;
}

export default function CategoryPot({ category, agents, onRemoveAgent }: CategoryPotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `category-${category}` });
  const meta = CATEGORIES[category];

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 p-4 min-h-[180px] transition-all ${meta.bgColor} ${
        isOver ? `${meta.borderColor} scale-[1.02] shadow-lg` : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${meta.color}`}>{meta.label}</h3>
        <span className={`text-sm font-medium ${meta.color} bg-white/60 px-2 py-0.5 rounded-full`}>
          {agents.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {agents.map((agent) => (
          <div key={agent.id} className="relative group">
            <DraggableAgent
              id={agent.id}
              name={agent.full_name}
              seed={agent.avatar_seed}
            />
            {onRemoveAgent && (
              <button
                onClick={() => onRemoveAgent(agent.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                title="Remove"
              >
                &times;
              </button>
            )}
          </div>
        ))}
        {agents.length === 0 && (
          <p className="text-sm text-gray-400 italic">Drop agents here</p>
        )}
      </div>
    </div>
  );
}
