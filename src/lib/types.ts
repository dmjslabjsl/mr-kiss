/** A compact, fully client-side description of an avatar. */
export interface Look {
  skin: number;
  hair: number;
  hairColor: number;
  blush: number;
}

/**
 * One kiss, stored as a gap from the previous kiss so the timings
 * survive the binary encoding. The first kiss always has a gap of 0.
 * `gap` is in milliseconds.
 */
export interface Kiss {
  /** 0–63, relative to the face box. */
  x: number;
  /** 0–63, relative to the face box. */
  y: number;
  /** Milliseconds since the previous kiss. */
  gap: number;
}

/** Everything needed to rebuild a note — nothing else is stored anywhere. */
export interface Note {
  from: string;
  to: string;
  fromLook: Look;
  toLook: Look;
  kisses: Kiss[];
}
