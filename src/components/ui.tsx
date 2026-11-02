import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps as RNTextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { AvatarTints, Colors, FontFamily, Radius, Spacing, Type, type ColorName, type TypeName } from '@/constants/theme';

/* ---------- Text ---------- */

type TextProps = RNTextProps & {
  variant?: TypeName;
  color?: ColorName;
  align?: TextStyle['textAlign'];
};

export function Text({ variant = 'body', color = 'text', align, style, ...rest }: TextProps) {
  return <RNText {...rest} style={[Type[variant], { color: Colors[color], textAlign: align }, style]} />;
}

/* ---------- Icon ---------- */

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 20, color = 'text' }: { name: IconName; size?: number; color?: ColorName }) {
  return <Ionicons name={name} size={size} color={Colors[color]} />;
}

/* ---------- Button ---------- */

type ButtonKind = 'primary' | 'ink' | 'soft' | 'outline' | 'ghost';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  size?: 'md' | 'sm';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const buttonColors: Record<ButtonKind, { bg: string; fg: ColorName; border: string }> = {
  primary: { bg: Colors.primary, fg: 'onPrimary', border: Colors.primary },
  ink: { bg: Colors.text, fg: 'onPrimary', border: Colors.text },
  soft: { bg: Colors.primarySoft, fg: 'primaryDeep', border: Colors.primarySoft },
  outline: { bg: Colors.background, fg: 'text', border: Colors.borderStrong },
  ghost: { bg: 'transparent', fg: 'primary', border: 'transparent' },
};

/** Square-cornered, small-caps buttons in the editorial style. */
export function Button({ label, onPress, kind = 'primary', icon, size = 'md', disabled, style, accessibilityLabel }: ButtonProps) {
  const c = buttonColors[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.button,
        size === 'sm' && styles.buttonSm,
        { backgroundColor: c.bg, borderColor: c.border, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 14 : 16} color={c.fg} /> : null}
      <RNText style={[styles.buttonLabel, size === 'sm' && styles.buttonLabelSm, { color: Colors[c.fg] }]}>
        {label.toUpperCase()}
      </RNText>
    </Pressable>
  );
}

/* ---------- Card ---------- */

export function Card({
  children,
  style,
  onPress,
  tone = 'surface',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tone?: 'surface' | 'plain' | 'purple' | 'blush' | 'warn';
}) {
  const toneStyle = {
    surface: { backgroundColor: Colors.surface, borderColor: Colors.surface },
    plain: { backgroundColor: Colors.background, borderColor: Colors.border },
    purple: { backgroundColor: Colors.primarySoft, borderColor: Colors.primarySoft },
    blush: { backgroundColor: Colors.blush, borderColor: Colors.blush },
    warn: { backgroundColor: Colors.warn, borderColor: Colors.warn },
  }[tone];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, toneStyle, pressed && { opacity: 0.9 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, toneStyle, style]}>{children}</View>;
}

/** A list row separated by a hairline rule, the editorial alternative to a boxed card. */
export function Row({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.row, style]}>{children}</View>;
}

/* ---------- Avatar ---------- */

function tintFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AvatarTints[h % AvatarTints.length];
}

export function Avatar({ name, size = 44, ring = false, square = false }: { name: string; size?: number; ring?: boolean; square?: boolean }) {
  const tint = tintFor(name);
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: square ? size * 1.25 : size, borderRadius: square ? Radius.sm : size / 2, backgroundColor: tint.bg },
        ring && { borderWidth: 1.5, borderColor: Colors.primary },
      ]}
      accessibilityLabel={name}>
      <RNText style={{ color: tint.fg, fontFamily: FontFamily.serif, fontSize: size * 0.38 }}>{initials}</RNText>
    </View>
  );
}

/* ---------- Chip ---------- */

export function Chip({
  label,
  selected,
  onPress,
  icon,
  tone = 'default',
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  tone?: 'default' | 'blush' | 'mint' | 'warn' | 'plum';
}) {
  const tones = {
    default: selected
      ? { bg: Colors.primary, fg: 'onPrimary' as ColorName, border: Colors.primary }
      : { bg: Colors.background, fg: 'textSecondary' as ColorName, border: Colors.borderStrong },
    blush: { bg: Colors.blush, fg: 'blushDeep' as ColorName, border: Colors.blush },
    mint: { bg: Colors.mint, fg: 'mintDeep' as ColorName, border: Colors.mint },
    warn: { bg: Colors.warn, fg: 'warnDeep' as ColorName, border: Colors.warn },
    plum: { bg: Colors.primarySoft, fg: 'primaryDeep' as ColorName, border: Colors.primarySoft },
  }[tone];

  const content = (
    <View style={[styles.chip, { backgroundColor: tones.bg, borderColor: tones.border }]}>
      {icon ? <Icon name={icon} size={13} color={tones.fg} /> : null}
      <Text variant="smallStrong" color={tones.fg}>
        {label}
      </Text>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
      {content}
    </Pressable>
  );
}

/* ---------- Section header ---------- */

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text variant="eyebrow" color="textSecondary">
        {title}
      </Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text variant="eyebrow" color="primary">
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ---------- Empty state ---------- */

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={22} color="primary" />
      </View>
      <Text variant="heading" align="center">
        {title}
      </Text>
      <Text variant="small" color="textSecondary" align="center">
        {body}
      </Text>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: Colors.border }} />;
}

/* ---------- Text field ---------- */

export function Field({ label, hint, error, ...input }: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text variant="eyebrow" color="textSecondary">
        {label}
      </Text>
      <TextInput
        placeholderTextColor={Colors.textMuted}
        {...input}
        style={[styles.input, error ? { borderColor: Colors.blushDeep } : null, input.style]}
      />
      {error ? (
        <Text variant="small" color="blushDeep">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" color="textSecondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 48,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  buttonSm: { minHeight: 40, paddingHorizontal: Spacing.lg },
  buttonLabel: { fontFamily: FontFamily.sansBold, fontSize: 13, letterSpacing: 0.8 },
  buttonLabelSm: { fontSize: 12 },
  card: { borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1 },
  row: { paddingVertical: Spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.xl },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
    fontSize: 15,
    fontFamily: FontFamily.sans,
    color: Colors.text,
  },
});
