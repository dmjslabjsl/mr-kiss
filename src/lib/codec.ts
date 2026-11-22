import { isValidLook } from './looks';
import type { Kiss, Look, Note } from './types';

/**
 * URL payload, version 1 (all integers big-endian):
 *
 *   [0]        version (1)
 *   [1..4]     from look: skin, hair, hairColor, blush
 *   [5..8]     to look:   skin, hair, hairColor, blush
 *   [9]        from-name byte length (1..16), then UTF-8 bytes
 *   [...]      to-name byte length (1..16), then UTF-8 bytes
 *   [...]      kiss count (0..100)
 *   [...]      count × 3 bytes: 6 bits x | 6 bits y | 12 bits gap (20ms units)
 *   [last]     CRC-8 of every preceding byte
 *
 * The whole payload is base64url-encoded into the hash: #v1.<payload>.
 * Nothing is ever sent to a server. A note with 100 kisses fits in
 * comfortably under 600 URL characters.
 */

export const VERSION = 1;
export const MAX_KISSES = 100;
export const MAX_NAME_CHARS = 12;
export const MAX_NAME_BYTES = 16;
export const MAX_GAP_UNITS = 4095;
export const MAX_GAP_MS = MAX_GAP_UNITS * 20; // 81.9 seconds
export const GAP_UNIT_MS = 20;
export const MAX_PAYLOAD_CHARS = 1200;

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

export type DecodeFailure =
  | 'empty'
  | 'bad-format'
  | 'unsupported-version'
  | 'too-long'
  | 'corrupt'
  | 'bad-look'
  | 'bad-name'
  | 'bad-kiss'
  | 'too-many-kisses';

export type DecodeResult =
  { ok: true; note: Note } | { ok: false; reason: DecodeFailure };

export class CodecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodecError';
  }
}

/** Counts user-perceived characters so an emoji is one character, not seven. */
export function charCount(value: string): number {
  if (segmenter) {
    let count = 0;
    for (const _ of segmenter.segment(value)) count += 1;
    return count;
  }
  return Array.from(value).length;
}

export function byteLength(value: string): number {
  return encoder.encode(value).length;
}

/**
 * Removes control characters, trims, and normalises. It is not in the
 * business of being clever with people's names — just safe to store.
 */
export function sanitizeName(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[\u202a-\u202e\u2066-\u2069\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .normalize('NFC');
}

export function nameProblem(value: string): string | null {
  const name = sanitizeName(value);
  if (!name) return 'Add a name first.';
  if (charCount(name) > MAX_NAME_CHARS) {
    return `Keep it to ${MAX_NAME_CHARS} characters or fewer.`;
  }
  if (byteLength(name) > MAX_NAME_BYTES) {
    return 'A little too fancy for a link — try fewer emoji.';
  }
  return null;
}

export function isValidName(value: string): boolean {
  return nameProblem(value) === null;
}

function crc8(bytes: Uint8Array): number {
  let crc = 0xff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x80 ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
    }
  }
  return crc;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array | null {
  const normalised = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/=+$/, '');
  if (!/^[A-Za-z0-9+/]*$/.test(normalised)) return null;
  try {
    const binary = atob(normalised);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function encodeLook(look: Look, out: number[]): void {
  if (!isValidLook(look))
    throw new CodecError('That avatar look is not available.');
  out.push(look.skin, look.hair, look.hairColor, look.blush);
}

/** Encodes a note to the payload part (without `#v1.`). */
export function encodeNote(note: Note): string {
  const fromProblem = nameProblem(note.from);
  if (fromProblem) throw new CodecError(fromProblem);
  const toProblem = nameProblem(note.to);
  if (toProblem) throw new CodecError(toProblem);
  if (note.kisses.length > MAX_KISSES) {
    throw new CodecError(`A note can hold at most ${MAX_KISSES} kisses.`);
  }

  const bytes: number[] = [VERSION];
  encodeLook(note.fromLook, bytes);
  encodeLook(note.toLook, bytes);

  const fromName = encoder.encode(sanitizeName(note.from));
  const toName = encoder.encode(sanitizeName(note.to));
  bytes.push(fromName.length, ...fromName, toName.length, ...toName);
  bytes.push(note.kisses.length);

  for (const kiss of note.kisses) {
    const x = clampInt(kiss.x, 0, 63);
    const y = clampInt(kiss.y, 0, 63);
    const gapUnits = clampInt(kiss.gap / GAP_UNIT_MS, 0, MAX_GAP_UNITS);
    const value = (x << 18) | (y << 12) | gapUnits;
    bytes.push((value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
  }

  bytes.push(crc8(Uint8Array.from(bytes)));
  return toBase64Url(Uint8Array.from(bytes));
}

export function encodeHash(note: Note): string {
  return `#v${VERSION}.${encodeNote(note)}`;
}

export function decodeNote(payload: string): DecodeResult {
  if (!payload) return { ok: false, reason: 'empty' };
  if (payload.length > MAX_PAYLOAD_CHARS)
    return { ok: false, reason: 'too-long' };

  const bytes = fromBase64Url(payload);
  if (!bytes || bytes.length < 14) return { ok: false, reason: 'corrupt' };
  if (bytes[0] !== VERSION) return { ok: false, reason: 'unsupported-version' };

  const body = bytes.subarray(0, bytes.length - 1);
  if (crc8(body) !== bytes[bytes.length - 1])
    return { ok: false, reason: 'corrupt' };

  let offset = 1;

  const readLook = (): Look | null => {
    if (offset + 4 > body.length) return null;
    const look = {
      skin: body[offset]!,
      hair: body[offset + 1]!,
      hairColor: body[offset + 2]!,
      blush: body[offset + 3]!,
    };
    offset += 4;
    return isValidLook(look) ? look : null;
  };

  const fromLook = readLook();
  if (!fromLook) return { ok: false, reason: 'bad-look' };
  const toLook = readLook();
  if (!toLook) return { ok: false, reason: 'bad-look' };

  const readName = (): string | null => {
    if (offset >= body.length) return null;
    const length = body[offset]!;
    offset += 1;
    if (length < 1 || length > MAX_NAME_BYTES || offset + length > body.length)
      return null;
    let name: string;
    try {
      name = decoder.decode(body.subarray(offset, offset + length));
    } catch {
      return null;
    }
    offset += length;
    if (!isValidName(name)) return null;
    return sanitizeName(name);
  };

  const from = readName();
  if (!from) return { ok: false, reason: 'bad-name' };
  const to = readName();
  if (!to) return { ok: false, reason: 'bad-name' };

  if (offset >= body.length) return { ok: false, reason: 'corrupt' };
  const count = body[offset]!;
  offset += 1;
  if (count > MAX_KISSES) return { ok: false, reason: 'too-many-kisses' };
  if (offset + count * 3 !== body.length)
    return { ok: false, reason: 'corrupt' };

  const kisses: Kiss[] = [];
  for (let i = 0; i < count; i += 1) {
    const value =
      (body[offset]! << 16) | (body[offset + 1]! << 8) | body[offset + 2]!;
    const x = (value >>> 18) & 63;
    const y = (value >>> 12) & 63;
    const gapUnits = value & MAX_GAP_UNITS;
    if (x > 63 || y > 63 || gapUnits > MAX_GAP_UNITS)
      return { ok: false, reason: 'bad-kiss' };
    kisses.push({ x, y, gap: gapUnits * GAP_UNIT_MS });
    offset += 3;
  }

  return { ok: true, note: { from, to, fromLook, toLook, kisses } };
}

/** Reads `#v1.…` from a URL hash (with or without the leading #). */
export function decodeHash(hash: string): DecodeResult | null {
  const raw = hash.replace(/^#/, '').trim();
  if (!raw) return null;
  const match = /^v(\d+)\.([A-Za-z0-9_\-+/=]+)$/.exec(raw);
  if (!match) return { ok: false, reason: 'bad-format' };
  if (Number(match[1]) !== VERSION)
    return { ok: false, reason: 'unsupported-version' };
  return decodeNote(match[2]!);
}

export function hashLength(note: Note): number {
  return encodeHash(note).length;
}

export function shareUrlFor(note: Note, baseUrl: string): string {
  const url = new URL(baseUrl);
  url.hash = `v${VERSION}.${encodeNote(note)}`;
  return url.toString();
}

/** Full URL from the current page, for the share sheet. */
export function currentShareUrl(note: Note): string {
  return shareUrlFor(note, window.location.href);
}

export function buildNote(
  from: string,
  to: string,
  fromLook: Look,
  toLook: Look
): Note {
  return {
    from: sanitizeName(from),
    to: sanitizeName(to),
    fromLook,
    toLook,
    kisses: [],
  };
}
