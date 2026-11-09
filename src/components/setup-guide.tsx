import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Icon, Text, type IconName } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useSetupFlags } from '@/lib/setup';
import { useStore } from '@/lib/store';

type Step = { key: string; icon: IconName; title: string; why: string; done: boolean; href: Href; optional?: boolean };

/**
 * "Get set up": a short checklist on Home for new accounts. Each step ticks
 * itself off from what the person has actually done, and tapping a step goes
 * straight to the place to do it. Hidden once they tap Hide, or "All set".
 */
export function SetupGuide() {
  const store = useStore();
  const { profile, birthday } = useAuth();
  const { flags, loaded, set } = useSetupFlags(store.meId);
  // Real accounts only: the preview's sample people are already set up.
  if (!store.live || !loaded || flags.hidden || store.loading) return null;

  const me = store.meId;
  const steps: Step[] =
    store.role === 'instructor'
      ? [
          {
            key: 'class',
            icon: 'calendar-outline',
            title: 'Add your first class',
            why: 'Pick the studio, day and time. Make it weekly and you never have to post it again.',
            done: store.classes.some((c) => c.instructorId === me),
            href: '/schedule/new',
          },
          {
            key: 'socials',
            icon: 'logo-instagram',
            title: 'Add your Instagram or TikTok',
            why: 'So people can find you and check your vibe before class.',
            done: !!(profile?.instagram_handle || profile?.tiktok_handle || store.instructor(me)?.instagram || store.instructor(me)?.tiktok),
            href: '/profile/edit',
          },
          {
            key: 'post',
            icon: 'create-outline',
            title: 'Make your first post',
            why: 'A hello, a playlist or your go-to smoothie. It gives new followers something to see.',
            done: store.posts.some((p) => p.instructorId === me),
            href: '/post/new',
          },
          {
            key: 'qr',
            icon: 'qr-code-outline',
            title: 'Open your QR code',
            why: 'Show it at the end of class. One scan and they follow you.',
            done: !!flags.openedQr || store.clients.length > 0,
            href: '/qr',
          },
        ]
      : [
          {
            key: 'follow',
            icon: 'heart-outline',
            title: 'Follow your first instructor',
            why: 'Search by name or studio, or scan their QR code after class.',
            done: store.following.size > 0,
            href: '/discover',
          },
          {
            key: 'book',
            icon: 'checkmark-circle-outline',
            title: 'Mark a class you’re going to',
            why: 'Tap Booked it on any class. It lands in Your schedule on Home.',
            done: store.booked.size > 0 || store.attendance.some((a) => a.clientId === me),
            href: '/discover',
          },
          {
            key: 'feed',
            icon: 'newspaper-outline',
            title: 'Check your feed',
            why: 'Playlists, recipes and updates from everyone you follow.',
            done: !!flags.openedFeed,
            href: '/feed',
          },
          {
            key: 'birthday',
            icon: 'gift-outline',
            title: 'Share your birthday',
            why: 'Optional. Your instructors get a heads up so they can celebrate you.',
            done: !!flags.birthdayDecided || !!birthday,
            href: '/settings/birthday',
            optional: true,
          },
        ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const next = steps.find((s) => !s.done);

  return (
    <Card tone="gray" style={styles.card}>
      <View style={styles.head}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="eyebrow" color="primary">
            {allDone ? 'All set' : 'Get set up'}
          </Text>
          <Text variant="heading">{allDone ? 'You’re ready. Nice work.' : `${doneCount} of ${steps.length} done`}</Text>
        </View>
        <Pressable onPress={() => set('hidden')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Hide the setup checklist">
          <Text variant="smallStrong" color="textSecondary">
            Hide
          </Text>
        </Pressable>
      </View>
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: steps.length, now: doneCount }}>
        <View style={[styles.fill, { width: `${(doneCount / steps.length) * 100}%` }]} />
      </View>

      {steps.map((s) => {
        const isNext = s === next;
        return (
          <Pressable
            key={s.key}
            onPress={() => !s.done && router.push(s.href)}
            disabled={s.done}
            style={[styles.step, isNext && styles.stepNext]}
            accessibilityRole="button"
            accessibilityState={{ checked: s.done, disabled: s.done }}
            accessibilityLabel={`${s.title}${s.optional ? ', optional' : ''}${s.done ? ', done' : ''}`}>
            <View style={[styles.check, s.done && styles.checkDone]}>
              {s.done ? <Icon name="checkmark" size={16} color="onPrimary" /> : <Icon name={s.icon} size={16} color="primary" />}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong" color={s.done ? 'textSecondary' : 'text'} style={s.done && styles.doneText}>
                {s.title}
                {s.optional && !s.done ? (
                  <Text variant="small" color="textSecondary">
                    {'  Optional'}
                  </Text>
                ) : null}
              </Text>
              {isNext ? (
                <Text variant="small" color="textSecondary">
                  {s.why}
                </Text>
              ) : null}
            </View>
            {!s.done ? <Icon name="chevron-forward" size={16} color="textSecondary" /> : null}
          </Pressable>
        );
      })}

      {allDone ? <Button size="sm" label="Done, hide this" onPress={() => set('hidden')} style={{ alignSelf: 'flex-start' }} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm, marginBottom: Spacing.xl },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.surfaceStrong, overflow: 'hidden', marginBottom: Spacing.sm },
  fill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm, borderRadius: Radius.md },
  stepNext: { backgroundColor: Colors.background },
  check: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primarySoft },
  checkDone: { backgroundColor: Colors.primary },
  doneText: { textDecorationLine: 'line-through' },
});
