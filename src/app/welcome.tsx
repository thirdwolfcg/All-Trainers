import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, Text } from '@/components/ui';
import { PingHero } from '@/components/ping-hero';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { enterDemo } = useAuth();
  const { showTips } = useStore();

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + Spacing.xxl, paddingBottom: insets.bottom + Spacing.xl }}>
      <View style={styles.column}>
        <View style={styles.hero}>
          <PingHero
            pings={[
              { title: 'Maya added a class', detail: 'Sat 9:00 · Reformer at Lumen' },
              { title: 'Jordan has a sub', detail: 'Tue 6:30 · Cycle at Ride Denver' },
            ]}
            label="Example notifications. Maya added a class. Jordan has a sub."
          />

          <Image source={require('@/assets/images/zomi-wordmark.png')} style={styles.wordmark} resizeMode="contain" accessibilityLabel="Zomi" />
          <Text variant="display" align="center">
            Never miss a class with your faves.
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            Every class your faves teach, every studio, one feed. No more screenshotting IG stories at 11pm.
          </Text>
        </View>

        <View style={styles.points}>
          {[
            { icon: 'calendar-outline' as const, text: 'Every class, every studio, one schedule' },
            { icon: 'heart-outline' as const, text: 'Know when your instructor adds a class or gets a sub' },
            { icon: 'musical-notes-outline' as const, text: 'Their playlists, recipes, videos and tips, all in their feed' },
            { icon: 'stats-chart-outline' as const, text: 'See your stats. Yes, all of them.' },
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
          <Button label="Let's go" onPress={() => router.push('/sign-up')} />
          <Button kind="outline" label="I already have one" onPress={() => router.push('/sign-in')} />
          <Button
            kind="ghost"
            label="Just let me look around"
            onPress={() => {
              showTips();
              enterDemo();
            }}
          />
          <Text
            variant="smallStrong"
            color="primary"
            align="center"
            accessibilityRole="link"
            onPress={() => router.push('/teach')}
            style={{ marginTop: Spacing.sm }}>
            Teach classes? This way ›
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wordmark: { width: 126, height: 60, alignSelf: 'center' },
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
