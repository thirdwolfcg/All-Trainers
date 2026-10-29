import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
  type StyleProp,
  type TextProps as RNTextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { AvatarTints, Colors, Fonts, Radius, Spacing, Type, type ColorName, type TypeName } from '@/constants/theme';

/* ---------- Text ---------- */

type TextProps = RNTextProps & {
  variant?: TypeName;
  color?: ColorName;
  align?: TextStyle['textAlign'];
};

export function Text({ variant = 'body', color = 'text', align, style, ...rest }: TextProps) {
  return (
    <RNText
      {...rest}
      style={[{ fontFamily: Fonts?.sans, color: Colors[color], textAlign: align }, Type[variant], style]}
    />
  );
}

/* ---------- Icon ---------- */

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 20, color = 'text' }: { name: IconName; size?: number; color?: ColorName }) {
  return <Ionicons name={name} size={size} color={Colors[color]} />;
}

/* ---------- Button ---------- */

type ButtonKind = 'primary' | 'soft' | 'outline' | 'ghost';

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
  soft: { bg: Colors.primarySoft, fg: 'primaryDeep', border: Colors.primarySoft },
  outline: { bg: Colors.background, fg: 'text', border: Colors.border },
  ghost: { bg: 'transparent', fg: 'primaryDeep', border: 'transparent' },
};

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
        { backgroundColor: c.bg, borderColor: c.border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 15 : 18} color={c.fg} /> : null}
      <Text variant={size === 'sm' ? 'smallStrong' : 'bodyStrong'} color={c.fg}>
        {label}
      </Text>
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
  tone?: 'surface' | 'plain' | 'purple' | 'blush';
}) {
  const toneStyle = {
    surface: { backgroundColor: Colors.surface, borderColor: Colors.surface },
    plain: { backgroundColor: Colors.background, borderColor: Colors.border },
    purple: { backgroundColor: Colors.primarySoft, borderColor: Colors.primarySoft },
    blush: { backgroundColor: Colors.blush, borderColor: Colors.blush },
  }[tone];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, toneStyle, pressed && { opacity: 0.9 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, toneStyle, style]}>{children}</View>;
}

/* ---------- Avatar ---------- */

function tintFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AvatarTints[h % AvatarTints.length];
}

export function Avatar({ name, size = 44, ring = false }: { name: string; size?: number; ring?: boolean }) {
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
        { width: size, height: size, borderRadius: size / 2, backgroundColor: tint.bg },
        ring && { borderWidth: 2, borderColor: Colors.primary },
      ]}
      accessibilityLabel={name}>
      <RNText style={{ color: tint.fg, fontWeight: '700', fontSize: size * 0.36, fontFamily: Fonts?.rounded }}>
        {initials}
      </RNText>
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
  tone?: 'default' | 'blush' | 'mint' | 'warn';
}) {
  const tones = {
    default: selected
      ? { bg: Colors.primary, fg: 'onPrimary' as ColorName }
      : { bg: Colors.surface, fg: 'textSecondary' as ColorName },
    blush: { bg: Colors.blush, fg: 'blushDeep' as ColorName },
    mint: { bg: Colors.mint, fg: 'mintDeep' as ColorName },
    warn: { bg: Colors.warn, fg: 'warnDeep' as ColorName },
  }[tone];

  const content = (
    <View style={[styles.chip, { backgroundColor: tones.bg }]}>
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
      <Text variant="title">{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text variant="smallStrong" color="primary">
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
        <Icon name={icon} size={24} color="primary" />
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

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 13,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  buttonSm: { paddingVertical: 8, paddingHorizontal: Spacing.lg },
  card: { borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.xl },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
});
