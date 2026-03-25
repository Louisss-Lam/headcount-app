import { createAvatar } from '@dicebear/core';
import { funEmoji } from '@dicebear/collection';

export function generateAvatarSvg(seed: string): string {
  const avatar = createAvatar(funEmoji, {
    seed,
    size: 64,
    mouth: ['lilSmile', 'cute', 'wideSmile', 'smileTeeth', 'smileLol', 'tongueOut', 'kissHeart'],
    eyes: ['wink', 'cute', 'love', 'wink2', 'glasses', 'stars'],
  });
  return avatar.toString();
}
