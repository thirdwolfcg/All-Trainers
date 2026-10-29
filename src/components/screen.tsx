import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

import { Text } from './ui';

/** Page wrapper: white background, safe area, centered column on wide screens. */
export function Screen({
  title,
  subtitle,
  right,
  children,
  scroll = true,
  padTop = true,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  padTop?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const header = title ? (
    <View style={styles.header}>
      <View style={{ flex: 1, gap: 2 }}>
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
    paddingHorizontal: Spacing.lg,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
