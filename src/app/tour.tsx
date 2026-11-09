import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, Text, type IconName } from '@/components/ui';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { greetName } from '@/lib/names';
import { useStore } from '@/lib/store';

type Slide = { icon: IconName; title: string; body: string };

const instructorSlides = (name?: string): Slide[] => [
  {
    icon: 'sparkles',
    title: name ? `Welcome to Zomi, ${name}` : 'Welcome to Zomi',
    body: 'Your classes, your people, every studio, one place. Here’s the 1 minute version of how it works.',
  },
  {
    icon: 'calendar-outline',
    title: 'Post your classes once',
    body: 'Add a class at any studio, make it weekly, and you’re done. Your followers always know where to find you, no more 24 hour stories.',
  },
  {
    icon: 'qr-code-outline',
    title: 'Bring your people',
    body: 'Flash your QR code at the end of class. One scan and they follow you, see your week and get your updates.',
  },
  {
    icon: 'heart-outline',
    title: 'Keep them close',
    body: 'Share playlists, recipes and updates. See your regulars on Followers, with birthdays and your private notes.',
  },
];

const clientSlides = (name?: string): Slide[] => [
  {
    icon: 'sparkles',
    title: name ? `Welcome to Zomi, ${name}` : 'Welcome to Zomi',
    body: 'Never miss a class with your faves, whatever studio they’re at this week. Here’s how it works.',
  },
  {
    icon: 'search-outline',
    title: 'Find your faves',
    body: 'Search Discover by name or studio, or scan your instructor’s QR code after class. Then tap Follow.',
  },
  {
    icon: 'calendar-outline',
    title: 'See where they’re teaching',
    body: 'Their classes show up on Home. Tap Booked it so you remember. You still book through the studio’s own app.',
  },
  {
    icon: 'musical-notes-outline',
    title: 'Get the extras',
    body: 'Playlists, recipes and updates from your instructors show up right on your Home. Your instructors can message you too.',
  },
];

/** A short welcome tour after sign up (and from Me, any time). Ends on Home, where the Get set up checklist takes over. */
export default function Tour() {
  const store = useStore();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const rawName = profile?.display_name ?? store.instructor(store.meId)?.name ?? store.clients.find((c) => c.id === store.meId)?.name;
  const name = rawName ? greetName(rawName) : undefined;
  const slides = store.role === 'instructor' ? instructorSlides(name) : clientSlides(name);
  const [i, setI] = useState(0);
  const slide = slides[i];
  const last = i === slides.length - 1;

  const finish = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }}>
      <View style={styles.column}>
        <View style={styles.top}>
          <Text variant="eyebrow" color="textSecondary">
            {i + 1} of {slides.length}
          </Text>
          {!last ? (
            <Pressable onPress={finish} hitSlop={12} accessibilityRole="button" accessibilityLabel="Skip the tour">
              <Text variant="smallStrong" color="primary">
                Skip
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.middle}>
          <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={[styles.glow, styles.glowOuter]} />
            <View style={[styles.glow, styles.glowInner]} />
            <View style={styles.disc}>
              <Icon name={slide.icon} size={40} color="onPrimary" />
            </View>
          </View>
          <Text variant="display" align="center" accessibilityRole="header">
            {slide.title}
          </Text>
          <Text variant="body" color="textSecondary" align="center" style={{ maxWidth: 420 }}>
            {slide.body}
          </Text>
        </View>

        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {slides.map((_, n) => (
            <View key={n} style={[styles.dot, n === i && styles.dotOn]} />
          ))}
        </View>

        <Button label={last ? 'Let’s set it up' : 'Next'} icon={last ? 'checkmark' : 'arrow-forward'} onPress={() => (last ? finish() : setI(i + 1))} />
        {/* Back keeps its space on the first slide so Next doesn't jump. */}
        <View style={{ marginTop: Spacing.sm, opacity: i > 0 ? 1 : 0 }} pointerEvents={i > 0 ? 'auto' : 'none'} accessibilityElementsHidden={i === 0}>
          <Button kind="ghost" label="Back" onPress={() => setI(Math.max(0, i - 1))} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  column: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: Spacing.xl },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 24 },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingVertical: Spacing.xxl },
  art: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  glow: { position: 'absolute', borderRadius: 999, backgroundColor: '#9C82D6' },
  glowOuter: { width: 180, height: 180, opacity: 0.18 },
  glowInner: { width: 136, height: 136, opacity: 0.3 },
  disc: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: Spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.surfaceStrong },
  dotOn: { width: 24, backgroundColor: Colors.primary },
});
