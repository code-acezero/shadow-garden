export type FrameGroup = 'store' | 'level' | 'title-board-of-darkness' | 'title-council-of-shadows';
export interface FrameMeta {
  id: string; group: FrameGroup; name: string; collection: string; collectionKey?: string;
  tier?: number; rarity?: string; price?: number; description?: string;
}
export const catalog: FrameMeta[];
export const DEFS_HTML: string;
/** Complete <svg> string. `uid` must be unique per mounted instance; `src` is the avatar image URL. */
export function frameMarkup(id: string, uid?: string, src?: string): string;
