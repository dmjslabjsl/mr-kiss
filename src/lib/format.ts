export function kissWord(count: number): string {
  return count === 1 ? 'kiss' : 'kisses';
}

export function kissCountLabel(count: number): string {
  return `${count} ${kissWord(count)}`;
}

/** Long pauses are gently shortened on playback. */
export const REPLAY_MAX_GAP_MS = 1400;
export const REPLAY_LEAD_IN_MS = 500;

export function plural(
  count: number,
  singular: string,
  pluralForm?: string
): string {
  return count === 1 ? singular : (pluralForm ?? `${singular}s`);
}
