import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

import { Icon, Text } from './ui';

/** Page wrapper: white background, safe area, centered column on wide screens. */
export function Screen({
  eyebrow,
  title,
  subtitle,
  right,
  children,
  scroll = true,
  padTop = true,
  back = false,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  padTop?: boolean;
  /** Show a back arrow above the title. Goes home if there is nothing to go back to. */
  back?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const backButton = back ? (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={12}
      style={{ alignSelf: 'flex-start', marginBottom: Spacing.md }}>
      <Icon name="arrow-back" size={24} color="primaryDeep" />
    </Pressable>
  ) : null;
  const header = title ? (
    <View style={styles.header}>
      <View style={{ flex: 1, gap: 6 }}>
        {eyebrow ? (
          <Text variant="eyebrow" color="textSecondary">
            {eyebrow}
          </Text>
        ) : null}
        <Text variant="display">{title}</Text>
        {subtitle ? (
          <Text variant="body" color="textSecondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  ) : null;

  const top = padTop ? insets.top + Spacing.lg : Spacing.lg;

  if (!scroll) {
    return (
      <View style={[styles.root, { paddingTop: top }]}>
        <View style={styles.column}>
          {backButton}
          {header}
          {children}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: top, paddingBottom: Spacing.xxl * 3 }}
      keyboardShouldPersistTaps="handled">
      <View style={styles.column}>
        {backButton}
        {header}
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
