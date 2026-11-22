import type { Look } from './types';

export interface SkinTone {
  name: string;
  base: string;
  shade: string;
  deep: string;
  highlight: string;
}

export interface HairStyle {
  name: string;
  note: string;
}

export interface HairColor {
  name: string;
  base: string;
  dark: string;
  light: string;
}

export interface BlushTone {
  name: string;
  cheek: string;
  lip: string;
  sweater: string;
  trim: string;
}

/** Warm, wide-ranging, and deliberately not gendered. */
export const SKINS: readonly SkinTone[] = [
  {
    name: 'Porcelain',
    base: '#f8ddc9',
    shade: '#eec4ab',
    deep: '#c58f74',
    highlight: '#fff1e5',
  },
  {
    name: 'Peach',
    base: '#f3c9a8',
    shade: '#e3b08e',
    deep: '#b97f5e',
    highlight: '#ffe4cd',
  },
  {
    name: 'Honey',
    base: '#e8b688',
    shade: '#d49c6d',
    deep: '#a86f48',
    highlight: '#f8d3ad',
  },
  {
    name: 'Caramel',
    base: '#cd9469',
    shade: '#b67a50',
    deep: '#8a5636',
    highlight: '#e5b78d',
  },
  {
    name: 'Chestnut',
    base: '#a86f4d',
    shade: '#8f5a3b',
    deep: '#653d28',
    highlight: '#c48d68',
  },
  {
    name: 'Espresso',
    base: '#7c4d36',
    shade: '#653a26',
    deep: '#452417',
    highlight: '#9c6a4e',
  },
];

export const HAIR_STYLES: readonly HairStyle[] = [
  { name: 'Fluff', note: 'soft & short' },
  { name: 'Bob', note: 'neat & sweet' },
  { name: 'Long', note: 'down & dreamy' },
  { name: 'Bun', note: 'up & cozy' },
  { name: 'Curls', note: 'round & springy' },
  { name: 'Waves', note: 'loose & beachy' },
];

export const HAIR_COLORS: readonly HairColor[] = [
  { name: 'Espresso', base: '#3b2929', dark: '#251919', light: '#5c3f3a' },
  { name: 'Chestnut', base: '#6a4331', dark: '#4a2c21', light: '#8d5d43' },
  { name: 'Honey', base: '#c08a55', dark: '#9b693b', light: '#daa975' },
  { name: 'Copper', base: '#a85a3b', dark: '#85412a', light: '#c97a55' },
  { name: 'Rose', base: '#b97884', dark: '#945864', light: '#d59ba5' },
  { name: 'Plum', base: '#6b4a68', dark: '#4c324a', light: '#8c6589' },
  { name: 'Silver', base: '#c8c2c0', dark: '#938a86', light: '#e2ddda' },
  { name: 'Ink', base: '#343b52', dark: '#222738', light: '#515b79' },
];

/** Also sets the lip and sweater palette, so every avatar feels coordinated. */
export const BLUSH_TONES: readonly BlushTone[] = [
  {
    name: 'Petal',
    cheek: '#ef8fa0',
    lip: '#c4546b',
    sweater: '#f2d3cd',
    trim: '#e5b4ad',
  },
  {
    name: 'Peach',
    cheek: '#f2a27d',
    lip: '#bf5f50',
    sweater: '#f4ddc6',
    trim: '#eac7a8',
  },
  {
    name: 'Rose',
    cheek: '#e07a90',
    lip: '#b84d67',
    sweater: '#edccd4',
    trim: '#e0acb7',
  },
  {
    name: 'Berry',
    cheek: '#c96b82',
    lip: '#a53e58',
    sweater: '#e8ced0',
    trim: '#d7a7ab',
  },
  {
    name: 'Honey',
    cheek: '#eda867',
    lip: '#b76b44',
    sweater: '#f1e3c8',
    trim: '#e5d0a6',
  },
  {
    name: 'Mauve',
    cheek: '#c88fa5',
    lip: '#9d5873',
    sweater: '#e8d5da',
    trim: '#d6b3c0',
  },
];

export const DEFAULT_FROM_LOOK: Look = {
  skin: 2,
  hair: 0,
  hairColor: 0,
  blush: 2,
};
export const DEFAULT_TO_LOOK: Look = {
  skin: 1,
  hair: 2,
  hairColor: 1,
  blush: 0,
};

export function isValidLook(value: Look): boolean {
  return (
    Number.isInteger(value.skin) &&
    value.skin >= 0 &&
    value.skin < SKINS.length &&
    Number.isInteger(value.hair) &&
    value.hair >= 0 &&
    value.hair < HAIR_STYLES.length &&
    Number.isInteger(value.hairColor) &&
    value.hairColor >= 0 &&
    value.hairColor < HAIR_COLORS.length &&
    Number.isInteger(value.blush) &&
    value.blush >= 0 &&
    value.blush < BLUSH_TONES.length
  );
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function randomLook(previous?: Look): Look {
  let next: Look;
  let guard = 0;
  do {
    next = {
      skin: Math.floor(Math.random() * SKINS.length),
      hair: Math.floor(Math.random() * HAIR_STYLES.length),
      hairColor: Math.floor(Math.random() * HAIR_COLORS.length),
      blush: Math.floor(Math.random() * BLUSH_TONES.length),
    };
    guard += 1;
  } while (previous && sameLook(next, previous) && guard < 20);
  return next;
}

export function sameLook(a: Look, b: Look): boolean {
  return (
    a.skin === b.skin &&
    a.hair === b.hair &&
    a.hairColor === b.hairColor &&
    a.blush === b.blush
  );
}

/** Used for the little "surprise" button — one tap, two fresh faces. */
export function randomPair(): { from: Look; to: Look } {
  return {
    from: randomLook(),
    to: randomLook(pick([DEFAULT_FROM_LOOK, DEFAULT_TO_LOOK])),
  };
}
