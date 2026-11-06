import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type Ping = { title: string; detail: string };

/** Two stacked "notifications" that show what Zomi does at a glance. Decorative, so screen readers get one summary label. */
export function PingHero({ pings, label }: { pings: [Ping, Ping]; label: string }) {
  return (
    <View style={styles.wrap} accessible accessibilityLabel={label}>
      {pings.map((p, i) => (
        <View key={p.title} style={[styles.ping, i === 0 ? styles.first : styles.second]}>
          <Image source={require('@/assets/images/zomi-icon-small.png')} style={styles.icon} />
          <View style={{ flex: 1 }}>
            <Text variant="smallStrong" numberOfLines={1}>
              {p.title}
            </Text>
            <Text variant="small" color="textSecondary" numberOfLines={1}>
              {p.detail}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 320, gap: Spacing.sm, marginBottom: Spacing.lg },
  ping: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg + 4,
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  first: { marginRight: Spacing.xl },
  second: { marginLeft: Spacing.xl, opacity: 0.9 },
  icon: { width: 36, height: 36, borderRadius: 9 },
});
