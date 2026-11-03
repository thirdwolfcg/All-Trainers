import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, Text, type IconName } from '@/components/ui';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useStore } from '@/lib/store';

type Slide = {
  icon: IconName;
  eyebrow: string;
  title: string;
  body: string;
  /** Small "where to find it" hint, shown as a pill. */
  where: { icon: IconName; label: string };
};

const clientSlides: Slide[] = [
  {
    icon: 'heart',
    eyebrow: 'Your people',
    title: 'Follow your faves',
    body: 'Follow the instructors you love and every class they teach, at every studio, lands on your Home.',
    where: { icon: 'search-outline', label: 'Discover tab' },
  },
  {
    icon: 'checkmark-circle',
    eyebrow: 'Your schedule',
    title: 'Booked it? Tap it.',
    body: 'Book where you always do, then tap "Booked it." Your classes for the week stay pinned at the top of Home.',
    where: { icon: 'home-outline', label: 'Top of Home' },
  },
  {
    icon: 'ticket',
    eyebrow: 'Booking',
    title: 'Book your way',
    body: '"Book it" opens the studio’s app, Mindbody or ClassPass, so your packs and credits still work.',
    where: { icon: 'calendar-outline', label: 'Any class' },
  },
  {
    icon: 'musical-notes',
    eyebrow: 'The extras',
    title: 'Playlists, recipes and more',
    body: 'Check an instructor’s feed for their playlists, recipes, videos and tips. Got a question? Message them.',
    where: { icon: 'person-outline', label: 'Instructor profiles' },
  },
  {
    icon: 'stats-chart',
    eyebrow: 'Your stats',
    title: 'Watch it add up',
    body: 'Tap "I went" after class and see how many classes you’ve taken, and with who.',
    where: { icon: 'stats-chart-outline', label: 'My classes tab' },
  },
];

const instructorSlides: Slide[] = [
  {
    icon: 'calendar',
    eyebrow: 'Your week',
    title: 'Post your week once',
    body: 'Add every class you teach, at every studio. Your followers see it right away. Stuck on a description? AI can draft one.',
    where: { icon: 'add', label: 'Add class on My Week' },
  },
  {
    icon: 'people',
    eyebrow: 'Your clientele',
    title: 'Everyone in one place',
    body: 'Anyone who follows you shows up in Clients, with their class history, birthdays and private notes only you can see.',
    where: { icon: 'people-outline', label: 'Clients tab' },
  },
  {
    icon: 'swap-horizontal',
    eyebrow: 'Subs',
    title: 'Find a sub in two taps',
    body: 'Can’t make a class? Ask instructors who teach at the same studio. Coworkers not on here yet? Text them an invite.',
    where: { icon: 'calendar-outline', label: 'Any of your classes' },
  },
  {
    icon: 'newspaper',
    eyebrow: 'Your feed',
    title: 'Share the extras',
    body: 'Post updates, videos, recipes and playlists. Your followers see them on your profile.',
    where: { icon: 'newspaper-outline', label: 'Feed tab' },
  },
  {
    icon: 'qr-code',
    eyebrow: 'Grow your crew',
    title: 'Your own QR code',
    body: 'Flash it at the end of class. One scan and they’re following you, even if they don’t have the app yet.',
    where: { icon: 'qr-code-outline', label: 'My QR on My Week' },
  },
];

/** A quick swipe-through of the app, shown right after onboarding and from Me. */
export default function Tour() {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const isInstructor = store.role === 'instructor';
  const slides = isInstructor ? instructorSlides : clientSlides;
  const [i, setI] = useState(0);
  const slide = slides[i];
  const last = i === slides.length - 1;

  const close = (to?: '/discover' | '/schedule/new') => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
    if (to) setTimeout(() => router.push(to), 50);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }]}>
      <View style={styles.column}>
        <View style={styles.top}>
          <Text variant="eyebrow" color="textSecondary">
            Quick tour · {i + 1} of {slides.length}
          </Text>
          <Pressable onPress={() => close()} accessibilityRole="button" accessibilityLabel="Skip the tour" hitSlop={12}>
            <Text variant="smallStrong" color="primary">
              Skip
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.art}>
            <View style={styles.ring}>
              <View style={styles.circle}>
                <Icon name={slide.icon} size={44} color="onPrimary" />
              </View>
            </View>
          </View>
          <Text variant="eyebrow" color="primary" align="center">
            {slide.eyebrow}
          </Text>
          <Text variant="display" align="center">
            {slide.title}
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            {slide.body}
          </Text>
          <View style={styles.where}>
            <Icon name={slide.where.icon} size={14} color="primaryDeep" />
            <Text variant="smallStrong" color="primaryDeep">
              {slide.where.label}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.dots} accessibilityElementsHidden>
          {slides.map((s, n) => (
            <Pressable key={s.title} onPress={() => setI(n)} hitSlop={6}>
              <View style={[styles.dot, n === i && styles.dotActive]} />
            </Pressable>
          ))}
        </View>

        <View style={{ gap: Spacing.sm }}>
          {last ? (
            <Button
              label={isInstructor ? 'Add my first class' : 'Find my people'}
              icon={isInstructor ? 'add' : 'search'}
              onPress={() => close(isInstructor ? '/schedule/new' : '/discover')}
            />
          ) : (
            <Button label="Next" onPress={() => setI(i + 1)} />
          )}
          {last ? (
            <Button kind="ghost" label="Take me home" onPress={() => close()} />
          ) : i > 0 ? (
            <Button kind="ghost" label="Back" onPress={() => setI(i - 1)} />
          ) : (
            <View style={{ height: 44 }} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  column: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  body: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  art: { marginBottom: Spacing.lg },
  ring: { width: 148, height: 148, borderRadius: 74, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 104, height: 104, borderRadius: 52, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  where: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { width: 22, backgroundColor: Colors.primary },
});
