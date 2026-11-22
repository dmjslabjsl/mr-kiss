import { describe, expect, it } from 'vitest';
import {
  MAX_GAP_MS,
  MAX_KISSES,
  MAX_NAME_BYTES,
  MAX_NAME_CHARS,
  byteLength,
  charCount,
  decodeHash,
  decodeNote,
  encodeHash,
  encodeNote,
  hashLength,
  nameProblem,
  sanitizeName,
  shareUrlFor,
  type DecodeResult,
} from './codec';
import type { Look, Note } from './types';

const lo: Look = { skin: 0, hair: 0, hairColor: 0, blush: 0 };
const hi: Look = { skin: 5, hair: 5, hairColor: 7, blush: 5 };

function note(overrides: Partial<Note> = {}): Note {
  return {
    from: 'Abhyuday',
    to: 'Mala',
    fromLook: lo,
    toLook: hi,
    kisses: [],
    ...overrides,
  };
}

function expectOk(result: DecodeResult): Note {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`expected ok, got ${result.reason}`);
  return result.note;
}

describe('name handling', () => {
  it('counts graphemes rather than UTF-16 units', () => {
    expect(charCount('Mala')).toBe(4);
    expect(charCount('Mala 💖')).toBe(6);
    expect(charCount('👩‍👩‍👧')).toBe(1);
  });

  it('trims and normalises whitespace and control characters', () => {
    expect(sanitizeName('  Mala \n  Devi ')).toBe('Mala Devi');
    expect(sanitizeName('Zoë')).toBe('Zoë');
    expect(sanitizeName('Mala\u202Eevil')).toBe('Malaevil');
  });

  it(`accepts up to ${MAX_NAME_CHARS} characters and ${MAX_NAME_BYTES} bytes`, () => {
    expect(nameProblem('')).not.toBeNull();
    expect(nameProblem('   ')).not.toBeNull();
    expect(nameProblem('a'.repeat(MAX_NAME_CHARS))).toBeNull();
    expect(nameProblem('a'.repeat(MAX_NAME_CHARS + 1))).not.toBeNull();
    expect(nameProblem('😍'.repeat(4))).toBeNull(); // 16 bytes
    expect(nameProblem('😍'.repeat(5))).not.toBeNull(); // 20 bytes
  });
});

describe('codec round trips', () => {
  it('round trips empty notes and unicode names', () => {
    const original = note({ from: 'Zoë', to: 'Mala 💖' });
    const encoded = encodeNote(original);
    const decoded = expectOk(decodeNote(encoded));
    expect(decoded).toEqual(original);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('round trips looks at both ends of the palette', () => {
    const decoded = expectOk(decodeNote(encodeNote(note())));
    expect(decoded.fromLook).toEqual(lo);
    expect(decoded.toLook).toEqual(hi);
  });

  it('round trips random kisses and quantises gaps to 20ms', () => {
    const kisses = Array.from({ length: 12 }, (_, i) => ({
      x: (i * 7) % 64,
      y: (i * 11) % 64,
      gap: i * 137,
    }));
    const decoded = expectOk(decodeNote(encodeNote(note({ kisses }))));
    expect(decoded.kisses).toEqual(
      kisses.map((k) => ({ ...k, gap: Math.round(k.gap / 20) * 20 }))
    );
  });

  it('clamps runaway gaps to the 12-bit ceiling', () => {
    const decoded = expectOk(
      decodeNote(
        encodeNote(note({ kisses: [{ x: 32, y: 32, gap: 10_000_000 }] }))
      )
    );
    expect(decoded.kisses[0]?.gap).toBe(MAX_GAP_MS);
  });

  it('handles the maximum number of kisses and stays URL-safe', () => {
    const kisses = Array.from({ length: MAX_KISSES }, (_, i) => ({
      x: i % 64,
      y: (i * 3) % 64,
      gap: (i % 40) * 250,
    }));
    const original = note({ from: 'A'.repeat(12), to: 'B'.repeat(12), kisses });
    const encoded = encodeNote(original);
    const decoded = expectOk(decodeNote(encoded));
    expect(decoded.kisses).toHaveLength(MAX_KISSES);
    const url = shareUrlFor(original, 'https://mrkiss.app/');
    expect(url.length).toBeLessThan(700);
    expect(hashLength(original)).toBe(encoded.length + 4);
    expect(MAX_NAME_BYTES).toBe(16);
  });

  it('clamps out-of-bounds coordinates instead of breaking the format', () => {
    const decoded = expectOk(
      decodeNote(encodeNote(note({ kisses: [{ x: -5, y: 300, gap: 0 }] })))
    );
    expect(decoded.kisses[0]).toEqual({ x: 0, y: 63, gap: 0 });
  });
});

describe('damaged links', () => {
  const encoded = encodeNote(
    note({
      kisses: [
        { x: 12, y: 34, gap: 400 },
        { x: 50, y: 20, gap: 120 },
      ],
    })
  );

  it('rejects non-payloads', () => {
    expect(decodeNote('')).toEqual({ ok: false, reason: 'empty' });
    expect(decodeNote('hello there!')).toEqual({
      ok: false,
      reason: 'corrupt',
    });
    expect(decodeNote('a'.repeat(2000))).toEqual({
      ok: false,
      reason: 'too-long',
    });
  });

  it('detects a single-character corruption with the checksum', () => {
    const flipped =
      encoded.slice(0, 5) + (encoded[5] === 'A' ? 'B' : 'A') + encoded.slice(6);
    expect(decodeNote(flipped)).toEqual({ ok: false, reason: 'corrupt' });
  });

  it('rejects truncation', () => {
    expect(decodeNote(encoded.slice(0, -3))).toEqual({
      ok: false,
      reason: 'corrupt',
    });
  });

  it('rejects unknown versions and malformed hashes', () => {
    expect(decodeHash(`#v2.${encoded}`)).toEqual({
      ok: false,
      reason: 'unsupported-version',
    });
    expect(decodeHash('#nope')).toEqual({ ok: false, reason: 'bad-format' });
    expect(decodeHash('#v1.!!!')).toEqual({ ok: false, reason: 'bad-format' });
    expect(decodeHash('')).toBeNull();
  });

  it('accepts a hash with no leading #', () => {
    expect(decodeHash(encodeHash(note()))?.ok).toBe(true);
  });
});

describe('encoder guard rails', () => {
  it('refuses invalid looks', () => {
    expect(() => encodeNote(note({ toLook: { ...hi, skin: 99 } }))).toThrow();
  });

  it('refuses too many kisses', () => {
    expect(() =>
      encodeNote(
        note({ kisses: [{ x: 1, y: 1, gap: 0 }, ...Array(MAX_KISSES)] })
      )
    ).toThrow();
  });

  it('refuses overlong names', () => {
    const long = 'a'.repeat(MAX_NAME_CHARS + 1);
    expect(() => encodeNote(note({ from: long }))).toThrow();
    expect(byteLength('😍'.repeat(5))).toBe(20);
  });
});
