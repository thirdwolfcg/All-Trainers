import { Stack, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button, Icon, Text, type IconName } from '@/components/ui';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';

const points: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'calendar-outline',
    title: 'Post your week once',
    body: 'Every class you teach, in one schedule. Your clients always know where to find you.',
  },
  {
    icon: 'people-outline',
    title: 'Your clientele, organized',
    body: 'Everyone who follows you in one list, with how often they come and when they last took your class.',
  },
  {
    icon: 'swap-horizontal',
    title: 'Find a sub in two taps',
    body: 'Ask instructors who teach at the same studio, right in the app.',
  },
  {
    icon: 'gift-outline',
    title: 'Remember the little things',
    body: 'Birthdays, goals, injuries, music taste. Private notes only you can see.',
  },
  {
    icon: 'qr-code-outline',
    title: 'Your own QR code',
    body: "Flash it at the end of class. One scan and they're following you.",
  },
  {
    icon: 'sparkles-outline',
    title: 'Coming soon: earn more',
    body: 'Premium extras for your biggest fans, like one on one time, and you get paid for it.',
  },
];

/** Landing page for instructors. Public, so invite links work for anyone. */
export default function Teach() {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const store = useStore();
  const inApp = auth.demo || (!!auth.session && !!auth.profile);

  const join = () => {
    store.setPendingRole('instructor');
    router.push('/sign-up');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ paddingTop: insets.top + Spacing.xxl, paddingBottom: insets.bottom + Spacing.xxl }}>
        <View style={styles.column}>
          <View style={styles.hero}>
            <View style={styles.stack}>
              <View style={[styles.bubble, { left: 0, top: 18 }]}>
                <Avatar name="Kendall Brooks" size={48} />
              </View>
              <View style={[styles.bubble, styles.center]}>
                <Avatar name="Maya Chen" size={72} ring />
              </View>
              <View style={[styles.bubble, { right: 0, top: 18 }]}>
                <Avatar name="Dev Patel" size={48} />
              </View>
            </View>
            <Text variant="eyebrow" color="primary" align="center">
              For instructors · Denver
            </Text>
            <Text variant="display" align="center">
              All your clients, one place.
            </Text>
            <Text variant="body" color="textSecondary" align="center">
              Teach at one studio or five. Keep your schedule, your people and the little details that matter together in one app.
            </Text>
          </View>

          <View style={styles.founding}>
            <Icon name="sparkles" size={18} color="primary" />
            <Text variant="bodyStrong" color="primaryDeep" style={{ flex: 1 }}>
              Founding instructors are free. Get in early.
            </Text>
          </View>

          <View style={{ gap: Spacing.lg }}>
            {points.map((p) => (
              <View key={p.title} style={styles.point}>
                <View style={styles.pointIcon}>
                  <Icon name={p.icon} size={18} color="primaryDeep" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{p.title}</Text>
                  <Text variant="small" color="textSecondary">
                    {p.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ gap: Spacing.sm }}>
            {inApp ? (
              <Button label="Go to the app" onPress={() => router.replace('/')} />
            ) : (
              <>
                <Button label="Join as an instructor" onPress={join} />
                <Button kind="outline" label="I already have an account" onPress={() => router.push('/sign-in')} />
                <Text
                  variant="smallStrong"
                  color="primary"
                  align="center"
                  accessibilityRole="link"
                  onPress={() => router.replace('/welcome')}
                  style={{ marginTop: Spacing.sm }}>
                  Just here to sweat? This way ›
                </Text>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xxl,
  },
  hero: { gap: Spacing.md, alignItems: 'center' },
  stack: { width: 200, height: 96, marginBottom: Spacing.md },
  bubble: { position: 'absolute' },
  center: { left: 64, top: 0 },
  founding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
  },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  pointIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
