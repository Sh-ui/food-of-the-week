import tailwindConfig from '../../tailwind.config.mjs';

export interface SectionColorScheme {
  bg: string;
  border: string;
  heading: string;
}

export interface SectionColors {
  firstSubsection: SectionColorScheme;
  listCategory: SectionColorScheme;
}

interface InstructionPaletteEntry {
  name: string;
  color: string;
}

type SchemeRef =
  | { scheme: string }
  | { bg: string; border: string; heading: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};

  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

const colors = readStringRecord(tailwindConfig?.theme?.extend?.colors);

const instructionPalette: InstructionPaletteEntry[] = Array.isArray(tailwindConfig?.theme?.extend?.instructionPalette)
  ? (tailwindConfig.theme.extend.instructionPalette as InstructionPaletteEntry[])
  : [];

const instructionSubsections: unknown = tailwindConfig?.theme?.extend?.instructionSubsections;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function parseHexToRgb(input: string): { r: number; g: number; b: number } | null {
  const hex = input.trim().toLowerCase().replace(/^#/, '');
  if (!/^[0-9a-f]+$/.test(hex)) return null;

  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return { r, g, b };
  }

  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
  }

  return null;
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function mixRgb(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) {
  const tt = clamp01(t);
  return {
    r: a.r + (b.r - a.r) * tt,
    g: a.g + (b.g - a.g) * tt,
    b: a.b + (b.b - a.b) * tt,
  };
}

function getTailwindColorValue(keyOrValue: string): string {
  return colors[keyOrValue] ?? keyOrValue;
}

function deriveSchemeFromBaseColor(baseColor: string): SectionColorScheme {
  const border = getTailwindColorValue(baseColor);
  const bgBase = getTailwindColorValue('bg');
  const textBase = getTailwindColorValue('text');

  const borderRgb = parseHexToRgb(border);
  const bgRgb = parseHexToRgb(bgBase);
  const textRgb = parseHexToRgb(textBase);

  if (!borderRgb || !bgRgb || !textRgb) {
    return { bg: bgBase, border, heading: textBase };
  }

  const bg = rgbToHex(mixRgb(bgRgb, borderRgb, 0.12));
  const heading = rgbToHex(mixRgb(textRgb, borderRgb, 0.65));
  return { bg, border, heading };
}

function resolveSchemeRef(ref: SchemeRef): SectionColorScheme {
  if ('scheme' in ref) {
    const paletteMatch = getEffectivePalette().find(entry => entry.name === ref.scheme);
    const base = paletteMatch?.color ?? ref.scheme;
    return deriveSchemeFromBaseColor(base);
  }

  return {
    bg: getTailwindColorValue(ref.bg),
    border: getTailwindColorValue(ref.border),
    heading: getTailwindColorValue(ref.heading),
  };
}

function readSchemeRef(value: unknown): SchemeRef | null {
  if (!isRecord(value)) return null;

  if (typeof value.scheme === 'string') {
    return { scheme: value.scheme };
  }

  if (typeof value.bg === 'string' && typeof value.border === 'string' && typeof value.heading === 'string') {
    return { bg: value.bg, border: value.border, heading: value.heading };
  }

  return null;
}

function readPositionOverrides(value: unknown): Record<number, SchemeRef> {
  if (!isRecord(value)) return {};

  const out: Record<number, SchemeRef> = {};
  for (const [rawKey, rawValue] of Object.entries(value)) {
    const index = Number(rawKey);
    if (!Number.isInteger(index) || index < 0) continue;

    const ref = readSchemeRef(rawValue);
    if (!ref) continue;

    out[index] = ref;
  }

  return out;
}

function getEffectivePalette(): InstructionPaletteEntry[] {
  if (instructionPalette.length > 0) return instructionPalette;

  const fallback = getTailwindColorValue('secondary') || getTailwindColorValue('accent') || '#999999';
  return [{ name: 'default', color: fallback }];
}

function readInfoSchemeRef(): SchemeRef {
  if (!isRecord(instructionSubsections)) {
    return { bg: 'bg-alt', border: 'secondary', heading: 'primary' };
  }

  const ref = readSchemeRef(instructionSubsections.info);
  if (ref) return ref;

  return { bg: 'bg-alt', border: 'secondary', heading: 'primary' };
}

const instructionSequenceRefs: SchemeRef[] = getEffectivePalette().map(entry => ({ scheme: entry.name }));

const positionOverrides: Record<number, SchemeRef> = isRecord(instructionSubsections)
  ? readPositionOverrides(instructionSubsections.overrides)
  : {};

export const sectionColors: SectionColors = {
  firstSubsection: resolveSchemeRef(readInfoSchemeRef()),
  listCategory: {
    bg: 'transparent',
    border: 'transparent',
    heading: 'inherit',
  },
};

/**
 * Get the color scheme for an instruction section by its index.
 * Colors cycle through the instructionSequence if there are more sections than colors.
 *
 * @param index - 0-indexed position of the instruction section (after first group)
 * @returns The color scheme for that position
 */
export function getInstructionColor(index: number): SectionColorScheme {
  const override = positionOverrides[index];
  if (override) return resolveSchemeRef(override);

  const sequenceLength = instructionSequenceRefs.length;
  if (sequenceLength === 0) return deriveSchemeFromBaseColor(getTailwindColorValue('secondary') || '#999999');

  return resolveSchemeRef(instructionSequenceRefs[index % sequenceLength]);
}

/**
 * Get the total number of instruction colors in the sequence.
 * Useful for testing or debugging color cycling.
 */
export function getInstructionColorCount(): number {
  return instructionSequenceRefs.length;
}
