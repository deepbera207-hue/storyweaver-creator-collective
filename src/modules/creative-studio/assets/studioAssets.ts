import portfolioAnimationFrame from '@/src/assets/images/portfolio_animation_frame_1794753933327.jpg';
import portfolioCharacterSheet from '@/src/assets/images/portfolio_character_sheet_1794753933586.jpg';
import portfolioSciFiConcept from '@/src/assets/images/portfolio_scifi_concept_1794753933586.jpg';
import avatarCreatorOne from '@/src/assets/images/avatar_creator_one_1794753934757.jpg';
import avatarCreatorTwo from '@/src/assets/images/avatar_creator_two_1794753935671.jpg';

const ASSET_MAP: Record<string, string> = {
  'asset://portfolio_animation_frame': portfolioAnimationFrame,
  'asset://portfolio_character_sheet': portfolioCharacterSheet,
  'asset://portfolio_scifi_concept': portfolioSciFiConcept,
  'asset://avatar_creator_one': avatarCreatorOne,
  'asset://avatar_creator_two': avatarCreatorTwo,
};

export function resolveStudioAsset(url?: string): string | undefined {
  if (!url) return undefined;
  return ASSET_MAP[url] ?? url;
}

export const STUDIO_BUNDLED_ASSETS = {
  portfolioAnimationFrame,
  portfolioCharacterSheet,
  portfolioSciFiConcept,
  avatarCreatorOne,
  avatarCreatorTwo,
};
