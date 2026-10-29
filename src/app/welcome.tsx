import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button, Icon, Text } from '@/components/ui';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { enterDemo } = useAuth();

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.xxl, paddingBottom: insets.bottom + Spacing.xl }]}>
      <View style={styles.column}>
        <View style={styles.hero}>
          <View style={styles.stack}>
            <View style={[styles.bubble, { left: 0, top: 18 }]}>
              <Avatar name="Maya Chen" size={56} />
            </View>
            <View style={[styles.bubble, styles.center]}>
              <Avatar name="Priya Raman" size={72} ring />
            </View>
            <View style={[styles.bubble, { right: 0, top: 18 }]}>
              <Avatar name="Jordan Ellis" size={56} />
            </View>
          </View>

          <Text variant="caption" color="primary" align="center">
            ALL TRAINERS
          </Text>
          <Text variant="display" align="center" style={{ fontSize: 32, lineHeight: 38 }}>
            Follow your instructors, not just your studios.
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            See where your favorite people are teaching this week, all in one place. No more chasing Instagram stories.
          </Text>
        </View>

        <View style={styles.points}>
          {[
            { icon: 'calendar-outline' as const, text: 'Every class, every studio, one schedule' },
            { icon: 'heart-outline' as const, text: 'Get a ping when they post or need a sub' },
            { icon: 'stats-chart-outline' as const, text: 'Track your classes by instructor and studio' },
          ].map((p) => (
            <View key={p.text} style={styles.point}>
              <View style={styles.pointIcon}>
                <Icon name={p.icon} size={18} color="primaryDeep" />
              </View>
              <Text variant="body" style={{ flex: 1 }}>
                {p.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ gap: Spacing.sm }}>
          <Button label="Create an account" onPress={() => router.push('/sign-up')} />
          <Button kind="outline" label="I already have one" onPress={() => router.push('/sign-in')} />
          <Button kind="ghost" label="Peek at the demo first" onPress={enterDemo} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    gap: Spacing.xl,
  },
  hero: { gap: Spacing.md, alignItems: 'center' },
  stack: { width: 200, height: 96, marginBottom: Spacing.md },
  bubble: { position: 'absolute' },
  center: { left: 64, top: 0 },
  points: { gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg },
  point: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  pointIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
