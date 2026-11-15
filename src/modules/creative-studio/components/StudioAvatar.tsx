import { useState } from 'react';
import { resolveStudioAsset } from '../assets/studioAssets';

interface StudioAvatarProps {
  name: string;
  avatarUrl?: string | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | undefined;
  tintBg?: string | undefined;
  tintText?: string | undefined;
}

const SIZE_CLASSES: Record<NonNullable<StudioAvatarProps['size']>, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-lg',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

export function StudioAvatar({
  name,
  avatarUrl,
  size = 'sm',
  tintBg = '#EEF2F6',
  tintText = '#334155',
}: StudioAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const resolved = resolveStudioAsset(avatarUrl);

  if (resolved && !imgError) {
    return (
      <img
        src={resolved}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${SIZE_CLASSES[size]} rounded-full object-cover shrink-0 border border-black/5 bg-white`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      style={{ backgroundColor: tintBg, color: tintText }}
      className={`${SIZE_CLASSES[size]} rounded-full shrink-0 flex items-center justify-center font-medium border border-black/5 select-none`}
    >
      {getInitials(name)}
    </div>
  );
}
