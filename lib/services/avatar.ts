import { createAvatar } from '@dicebear/core';
import { funEmoji } from '@dicebear/collection';

export function generateAvatarSvg(seed: string): string {
  const avatar = createAvatar(funEmoji, {
    seed,
    size: 64,
  });
  return avatar.toString();
}
