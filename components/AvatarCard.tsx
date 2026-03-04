'use client';

import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { funEmoji } from '@dicebear/collection';

interface AvatarCardProps {
  name: string;
  seed: string;
  animationDelay?: number;
  isDragging?: boolean;
}

export default function AvatarCard({ name, seed, animationDelay = 0, isDragging = false }: AvatarCardProps) {
  const svgDataUri = useMemo(() => {
    const avatar = createAvatar(funEmoji, { seed, size: 64 });
    return avatar.toDataUri();
  }, [seed]);

  return (
    <div
      className={`flex flex-col items-center gap-1 p-3 rounded-xl bg-white shadow-sm border border-gray-100 transition-all ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      <div
        className="animate-float"
        style={{ animationDelay: `${animationDelay}s` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svgDataUri} alt={name} width={64} height={64} />
      </div>
      <span className="text-xs font-medium text-gray-700 text-center leading-tight max-w-[80px] truncate">
        {name}
      </span>
    </div>
  );
}
