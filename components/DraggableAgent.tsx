'use client';

import { useDraggable } from '@dnd-kit/core';
import AvatarCard from './AvatarCard';

interface DraggableAgentProps {
  id: string;
  name: string;
  seed: string;
  animationDelay?: number;
}

export default function DraggableAgent({ id, name, seed, animationDelay = 0 }: DraggableAgentProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `agent-${id}`,
    data: { agentId: id, name, seed },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="touch-none">
      <AvatarCard
        name={name}
        seed={seed}
        animationDelay={animationDelay}
        isDragging={isDragging}
      />
    </div>
  );
}
