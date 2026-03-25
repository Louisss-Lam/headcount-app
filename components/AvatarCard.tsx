'use client';

import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { funEmoji } from '@dicebear/collection';

interface AvatarCardProps {
  name: string;
  seed: string;
  animationDelay?: number;
  isDragging?: boolean;
  size?: number;
  nameClass?: string;
}

export default function AvatarCard({ name, seed, animationDelay = 0, isDragging = false, size = 64, nameClass }: AvatarCardProps) {
  const svgDataUri = useMemo(() => {
    const avatar = createAvatar(funEmoji, {
      seed,
      size,
      mouth: ['lilSmile', 'cute', 'wideSmile', 'smileTeeth', 'smileLol', 'tongueOut', 'kissHeart'],
      eyes: ['wink', 'cute', 'love', 'ppiiu', 'wink2', 'glasses'],
    });
    return avatar.toDataUri();
  }, [seed, size]);

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
        <img src={svgDataUri} alt={name} width={size} height={size} />
      </div>
      <span className={nameClass ?? "text-xs font-medium text-gray-700 text-center leading-tight max-w-[80px] truncate"}>
        {name}
      </span>
    </div>
  );
}
