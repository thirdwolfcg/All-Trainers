/**
 * All Trainers design tokens: "Studio Editorial".
 * White ground, plum accent, soft gray surfaces, thin rules instead of boxes.
 * Serif display (Fraunces) over a clean sans (Inter).
 */
import '@/global.css';

export const Colors = {
  background: '#FFFFFF',
  surface: '#F4F2F7', // soft gray-lilac for inputs and highlight panels
  surfaceStrong: '#ECE8F2',
  border: '#E6E3EA', // hairline rules
  borderStrong: '#D9D5DF', // outline buttons and chips

  text: '#1C1A22',
  textSecondary: '#6B6675',
  textMuted: '#8A8494', // decorative only, never for small text that must be read

  primary: '#4B2E83', // plum
  primaryDeep: '#331E5E',
  primarySoft: '#EFEAF7',
  onPrimary: '#FFFFFF',

  gray: '#F1F0F3', // birthday card
  blush: '#F6E4EC', // premium
  blushDeep: '#8E2F5A',
  mint: '#E2F2EA',
  mintDeep: '#1F6B4E',
  warn: '#FBF0DC',
  warnDeep: '#85540A',
} as const;

export type ColorName = keyof typeof Colors;

export const AvatarTints = [
  { bg: '#EEEAF4', fg: '#4B2E83' },
  { bg: '#F6E4EC', fg: '#8E2F5A' },
  { bg: '#E2F2EA', fg: '#1F6B4E' },
  { bg: '#E6ECF7', fg: '#2F4F8A' },
  { bg: '#F7ECE1', fg: '#85501A' },
] as const;

/** Font family names, registered in the root layout. */
export const FontFamily = {
  serif: 'Fraunces_500Medium',
  serifItalic: 'Fraunces_400Regular_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansBold: 'Inter_600SemiBold',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 4,
  md: 6,
  lg: 8,
  pill: 999,
} as const;

export const Type = {
  display: { fontFamily: FontFamily.serif, fontSize: 34, lineHeight: 40, letterSpacing: -0.6 },
  title: { fontFamily: FontFamily.serif, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  heading: { fontFamily: FontFamily.serif, fontSize: 19, lineHeight: 24 },
  quote: { fontFamily: FontFamily.serifItalic, fontSize: 18, lineHeight: 26 },
  body: { fontFamily: FontFamily.sans, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: FontFamily.sansBold, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: FontFamily.sans, fontSize: 13, lineHeight: 18 },
  smallStrong: { fontFamily: FontFamily.sansBold, fontSize: 13, lineHeight: 18 },
  eyebrow: { fontFamily: FontFamily.sansBold, fontSize: 11, lineHeight: 14, letterSpacing: 1.4, textTransform: 'uppercase' as const },
  caption: { fontFamily: FontFamily.sansBold, fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },
} as const;

export type TypeName = keyof typeof Type;

export const MaxContentWidth = 640;
