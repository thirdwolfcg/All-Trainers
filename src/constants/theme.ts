/**
 * All Trainers design tokens.
 * Light and airy: white base, soft lavender surfaces, one confident purple.
 */
import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  background: '#FFFFFF',
  surface: '#F7F5FB', // soft lavender gray for cards and inputs
  surfaceStrong: '#EFEBF7',
  border: '#E8E3F1',

  text: '#1E1A29',
  textSecondary: '#6D6780',
  textMuted: '#A39DB2',

  primary: '#7B5CE6', // main purple
  primaryDeep: '#5A3DC2', // pressed states and text on soft purple
  primarySoft: '#F1ECFE', // purple tint backgrounds
  onPrimary: '#FFFFFF',

  blush: '#F7D9E8', // birthdays and celebration moments
  blushDeep: '#B4417A',
  mint: '#DDF3EA', // confirmations
  mintDeep: '#22785A',
  warn: '#FFF1D6',
  warnDeep: '#9A6206',
} as const;

export type ColorName = keyof typeof Colors;

/** Avatar tints, picked by name so each person keeps the same color. */
export const AvatarTints = [
  { bg: '#EDE7FE', fg: '#5A3DC2' },
  { bg: '#F7D9E8', fg: '#A3346C' },
  { bg: '#DDF3EA', fg: '#22785A' },
  { bg: '#E3ECFB', fg: '#2F5BA8' },
  { bg: '#FBEBDD', fg: '#9A5413' },
] as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded' },
  web: { sans: 'var(--font-display)', rounded: 'var(--font-rounded)' },
  default: { sans: 'normal', rounded: 'normal' },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const Type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, letterSpacing: -0.4 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const, letterSpacing: -0.2 },
  heading: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600' as const },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  smallStrong: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const, letterSpacing: 0.4 },
} as const;

export type TypeName = keyof typeof Type;

export const MaxContentWidth = 640;
