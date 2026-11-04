import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ClassCard, InstructorRow, PostCard } from '@/components/cards';
import { ConfirmSheet } from '@/components/confirm-sheet';
import { InstructorClassActions } from '@/components/instructor-class-actions';
import { MyClassesPanel } from '@/components/my-classes';
import { PreviewSwitch } from '@/components/preview-switch';
import { Screen } from '@/components/screen';
import { Avatar, Button, Card, EmptyState, Icon, SectionHeader, Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { addDays, dayLabel, isSameDay, shortDay, startOfDay, timeLabel } from '@/lib/dates';
import { useAuth } from '@/lib/auth';
import { useMe } from '@/lib/me';
import { useStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { greetName } from '@/lib/names';
import { Tip } from '@/components/tip';

export default function HomeScreen() {
  const { role } = useStore();
  return role === 'instructor' ? <InstructorWeek /> : <ClientHome />;
}

function todayEyebrow() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/* ---------- Day picker: underlined text tabs ---------- */

function DayTabs({ selected, onSelect, counts }: { selected: Date; onSelect: (d: Date) => void; counts: number[] }) {
  const today = startOfDay(new Date());
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabs} contentContainerStyle={{ gap: Spacing.xl }}>
      {Array.from({ length: 7 }, (_, i) => {
        const d = addDays(today, i);
        const active = isSameDay(d, selected);
        const busy = counts[i] > 0;
        return (
          <Pressable
            key={i}
            onPress={() => onSelect(d)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${dayLabel(d)}, ${counts[i]} classes`}
            style={[styles.dayTab, active && styles.dayTabActive]}>
            <Text variant={active ? 'bodyStrong' : 'body'} color={active ? 'text' : 'textSecondary'}>
              {i === 0 ? 'Today' : `${shortDay(d)} ${d.getDate()}`}
            </Text>
            {/* A dot under days when your people are teaching */}
            <View style={[styles.dayDot, { opacity: busy ? 1 : 0 }]} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ---------- Client home ---------- */

function ClientHome() {
  const store = useStore();
  const me = useMe();
  const firstName = greetName(me.name);
  const [day, setDay] = useState(() => startOfDay(new Date()));
  const [view, setView] = useState<'week' | 'mine'>('week');

  const followedClasses = useMemo(() => store.classes.filter((c) => store.following.has(c.instructorId)), [store.classes, store.following]);

  const counts = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => followedClasses.filter((c) => isSameDay(new Date(c.startsAt), addDays(today, i))).length);
  }, [followedClasses]);

  const dayClasses = followedClasses.filter((c) => isSameDay(new Date(c.startsAt), day));
  const today = counts[0];
  const suggestions = store.instructors.filter((i) => !store.following.has(i.id)).slice(0, 3);
  const followingCount = store.following.size;
  const auth = useAuth();
  const hasBirthday = !auth.demo && auth.session ? !!auth.birthday : !!store.clients.find((c) => c.id === 'me')?.birthday;
  const needsBirthday = !hasBirthday && !store.dismissedTips.has('birthday-nudge');
  const now = new Date();
  const myWeek = store.classes
    .filter(
      (c) =>
        store.booked.has(c.id) &&
        c.status !== 'cancelled' &&
        new Date(c.startsAt).getTime() + c.durationMin * 60000 > now.getTime() &&
        new Date(c.startsAt) < addDays(startOfDay(now), 7),
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return (
    <Screen
      eyebrow={todayEyebrow()}
      title="Where we sweating today?"
      subtitle={
        followingCount === 0
          ? `Hiii ${firstName}! Follow a few instructors and their classes will show up right here.`
          : today
            ? `Hiii ${firstName}! ${today === 1 ? 'One of your people is' : `${today} of your people are`} teaching today.`
            : `Hiii ${firstName}! Here's where your people are teaching this week.`
      }>
      <PreviewSwitch />
      <View style={styles.segment}>
        {(['week', 'mine'] as const).map((v) => (
          <Pressable
            key={v}
            onPress={() => setView(v)}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === v }}
            style={[styles.segmentItem, view === v && styles.segmentActive]}>
            <Text variant="smallStrong" color={view === v ? 'primaryDeep' : 'textSecondary'}>
              {v === 'week' ? 'This week' : 'My classes'}
            </Text>
          </Pressable>
        ))}
      </View>
      {view === 'mine' ? (
        <MyClassesPanel />
      ) : (
        <>
          <Tip id="tip-schedule" text="This is your schedule. Booked a class somewhere? Tap “Booked it” on it and it lands here." />
          <Card tone="purple" style={{ gap: Spacing.md, marginBottom: Spacing.xl }}>
            <View style={styles.inline}>
              <Icon name="checkmark-circle" size={18} color="primary" />
              <Text variant="eyebrow" color="primary">
                Your schedule{myWeek.length ? ` · ${myWeek.length} this week` : ''}
              </Text>
            </View>
            {myWeek.length ? (
              myWeek.map((c) => {
                const start = new Date(c.startsAt);
                const who = store.instructor(c.instructorId);
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => router.push({ pathname: '/class/[id]', params: { id: c.id } })}
                    accessibilityRole="link"
                    accessibilityLabel={`${c.title}, ${dayLabel(start)} at ${timeLabel(start)}`}
                    style={styles.weekRow}>
                    <View style={{ width: 92 }}>
                      <Text variant="smallStrong" color="primaryDeep">
                        {dayLabel(start) === 'Today' || dayLabel(start) === 'Tomorrow' ? dayLabel(start) : shortDay(start)}
                      </Text>
                      <Text variant="small" color="textSecondary">
                        {timeLabel(start)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{c.title}</Text>
                      <Text variant="small" color="textSecondary">
                        {who ? `with ${who.name.split(' ')[0]} · ` : ''}
                        {store.studio(c.studioId)?.name}
                      </Text>
                    </View>
                    <Icon name="chevron-forward" size={16} color="textSecondary" />
                  </Pressable>
                );
              })
            ) : (
              <Text variant="small" color="textSecondary">
                Nothing on your schedule yet. Booked a class? Tap &quot;Booked it&quot; on it below and it shows up here.
              </Text>
            )}
          </Card>

          {followingCount === 0 ? (
            <>
              <Tip id="tip-follow" text="Start here. Find the instructors you take class with and follow them." pointer="none" />
              <EmptyState
                icon="heart-outline"
                title="Your feed is empty (for now)"
                body="Follow your favorite instructors and every class they teach, at every studio, shows up here."
              />
              <Pressable
                onPress={() => router.push('/discover')}
                style={styles.findButton}
                accessibilityRole="button"
                accessibilityLabel="Find instructors to follow">
                <Icon name="search" size={18} color="textSecondary" />
                <Text variant="body" color="textSecondary" style={{ flex: 1 }}>
                  Find instructors to follow
                </Text>
                <Icon name="arrow-forward" size={18} color="primary" />
              </Pressable>
              {suggestions.length ? (
                <>
                  <SectionHeader title="Start with these" action="See all" onAction={() => router.push('/discover')} />
                  {suggestions.map((i) => (
                    <InstructorRow key={i.id} instructor={i} />
                  ))}
                </>
              ) : null}
            </>
          ) : (
            <>
              <SectionHeader title={`What your people are teaching · ${followingCount}`} action="Find more" onAction={() => router.push('/discover')} />
              <DayTabs selected={day} onSelect={setDay} counts={counts} />
              <Tip
                id="tip-book"
                text="“Book it” opens the studio’s app, Mindbody or ClassPass. Tap a class to see the details."
                style={{ marginTop: Spacing.md }}
              />
              <View style={{ marginBottom: Spacing.xxl }}>
                {dayClasses.length ? (
                  dayClasses.map((c) => <ClassCard key={c.id} session={c} />)
                ) : (
                  <EmptyState
                    icon="cafe-outline"
                    title="Rest day energy"
                    body="None of your people are teaching that day. Pick another day or find someone new."
                  />
                )}
              </View>

              {needsBirthday ? (
                <Card tone="gray" style={{ gap: Spacing.sm, marginBottom: Spacing.xxl }}>
                  <View style={styles.inline}>
                    <Icon name="gift-outline" size={18} color="primary" />
                    <Text variant="eyebrow" color="primary">
                      Share your birthday?
                    </Text>
                  </View>
                  <Text variant="small" color="textSecondary">
                    Only if you want to. Instructors you follow can wish you a happy birthday. Month and day only.
                  </Text>
                  <View style={[styles.inline, { marginTop: 4 }]}>
                    <Button size="sm" label="Choose" onPress={() => router.push('/settings/birthday')} />
                    <Button size="sm" kind="ghost" label="Not now" onPress={() => store.dismissTip('birthday-nudge')} />
                  </View>
                </Card>
              ) : null}
            </>
          )}
        </>
      )}
    </Screen>
  );
}

/* ---------- Instructor week ---------- */

function InstructorWeek() {
  const store = useStore();
  const me = store.instructor(store.meId)!;
  const today = startOfDay(new Date());
  // My classes, plus any I'm covering for someone else
  const mine = store.classes.filter(
    (c) => (c.instructorId === me.id || c.subInstructorId === me.id) && new Date(c.startsAt) >= today && new Date(c.startsAt) < addDays(today, 7),
  );
  // Open asks, plus ones I said no to that still need a sub (so a mis-tap can be taken back)
  const asksForMe = store.subRequests.filter((r) => {
    if (r.toInstructorId !== me.id) return false;
    if (r.status === 'pending') return true;
    return r.status === 'declined' && store.classes.find((c) => c.id === r.classId)?.status === 'sub_needed';
  });
  const toast = useToast();
  const [confirmAsk, setConfirmAsk] = useState<string | null>(null);
  const askToConfirm = confirmAsk ? store.subRequests.find((r) => r.id === confirmAsk) : undefined;
  const classToConfirm = askToConfirm ? store.classes.find((c) => c.id === askToConfirm.classId) : undefined;
  const studiosThisWeek = new Set(mine.map((c) => c.studioId)).size;
  // Before the first class, the page is just a stage with one button.
  const hasAnyClass = store.classes.some((c) => c.instructorId === me.id || c.subInstructorId === me.id);
  const myPosts = store.posts
    .filter((p) => p.instructorId === me.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  const byDay = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i);
    return { day: d, classes: mine.filter((c) => isSameDay(new Date(c.startsAt), d)) };
  }).filter((g) => g.classes.length);

  return (
    <Screen
      eyebrow={todayEyebrow()}
      title={`Hiii ${greetName(me.name)}`}
      subtitle={
        mine.length === 0
          ? 'Empty week, full potential.'
          : `${mine.length} ${mine.length === 1 ? 'class' : 'classes'}, ${studiosThisWeek} ${studiosThisWeek === 1 ? 'studio' : 'studios'}, one schedule. You're booked and busy.`
      }
      right={
        <Pressable onPress={() => router.push('/qr')} style={styles.qrButton} accessibilityRole="button" accessibilityLabel="My QR code">
          <Icon name="qr-code-outline" size={22} color="primary" />
          <Text variant="eyebrow" color="primary" style={{ fontSize: 9 }}>
            My QR
          </Text>
        </Pressable>
      }>
      <PreviewSwitch />
      <Tip id="tip-qr" text="Tap My QR (top right) and flash it after class. One scan and they’re following you." pointer="none" />
      {asksForMe.length ? (
        <Card tone="purple" style={{ gap: Spacing.md, marginBottom: Spacing.xl }}>
          <View style={styles.inline}>
            <Icon name="swap-horizontal" size={18} color="primaryDeep" />
            <Text variant="eyebrow" color="primaryDeep">
              Can you cover?
            </Text>
          </View>
          {asksForMe.map((r) => {
            const cls = store.classes.find((c) => c.id === r.classId);
            const from = store.instructor(r.fromInstructorId);
            const studio = cls ? store.studio(cls.studioId) : undefined;
            if (!cls || !from || !studio) return null;
            const start = new Date(cls.startsAt);
            const fromFirst = from.name.split(' ')[0];
            const declined = r.status === 'declined';
            return (
              <View key={r.id} style={{ gap: Spacing.sm, opacity: declined ? 0.8 : 1 }}>
                <Pressable style={styles.inline} onPress={() => router.push({ pathname: '/class/[id]', params: { id: cls.id } })} accessibilityRole="link">
                  <Avatar name={from.name} size={32} />
                  <Text variant="body" style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{fromFirst}</Text> needs a sub for {cls.title} at {studio.name}, {dayLabel(start)} at{' '}
                    {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </Pressable>
                {declined ? (
                  <View style={[styles.inline, { justifyContent: 'space-between', gap: Spacing.sm }]}>
                    <Text variant="small" color="textSecondary" style={{ flex: 1 }}>
                      You said you can&apos;t. Changed your mind?
                    </Text>
                    <Button size="sm" kind="outline" label="Undo" onPress={() => store.undoSubDecline(r.id)} />
                    <Button size="sm" kind="primary" label="I got you" onPress={() => setConfirmAsk(r.id)} />
                  </View>
                ) : (
                  <View style={[styles.inline, { justifyContent: 'flex-end', gap: Spacing.sm }]}>
                    <Button
                      size="sm"
                      kind="outline"
                      label="Can't"
                      onPress={() => {
                        store.respondToSub(r.id, false);
                        toast(`Told ${fromFirst} you can't make it.`, { label: 'Undo', onPress: () => store.undoSubDecline(r.id) });
                      }}
                    />
                    <Button size="sm" kind="primary" label="I got you" onPress={() => setConfirmAsk(r.id)} />
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      ) : null}

      <ConfirmSheet
        open={!!askToConfirm && !!classToConfirm}
        title={`Cover ${classToConfirm?.title ?? 'this class'}?`}
        body={
          classToConfirm
            ? `${dayLabel(new Date(classToConfirm.startsAt))} at ${new Date(classToConfirm.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}, ${store.studio(classToConfirm.studioId)?.name}. It goes on your schedule and their clients will see you're subbing.`
            : ''
        }
        confirmLabel="I got you"
        cancelLabel="Not yet"
        onConfirm={() => {
          if (!askToConfirm) return;
          store.respondToSub(askToConfirm.id, true);
          toast(`You're covering ${classToConfirm?.title}. It's on your week now.`);
        }}
        onClose={() => setConfirmAsk(null)}
      />

      {hasAnyClass ? (
        <>
          <Tip id="tip-add" text="Add every class you teach, at every studio. Set it to repeat so you only do it once." />
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl }}>
            <Button
              kind="primary"
              icon="add"
              label="Add class"
              accessibilityLabel="Add a class"
              onPress={() => router.push('/schedule/new')}
              style={{ flex: 1 }}
            />
            <Button
              kind="outline"
              icon="create-outline"
              label="Post"
              accessibilityLabel="Post to your feed"
              onPress={() => router.push('/post/new')}
              style={{ flex: 1 }}
            />
          </View>
        </>
      ) : null}

      {byDay.length ? (
        <>
          <Tip id="tip-sub" text="Can’t make a class? Tap “Need a sub” under it to ask instructors at the same studio." />
          {byDay.map((g) => (
            <View key={g.day.toISOString()} style={{ marginBottom: Spacing.xl }}>
              <SectionHeader title={dayLabel(g.day)} />
              {g.classes.map((c) => (
                <View key={c.id}>
                  <ClassCard session={c} showInstructor={false} />
                  {c.instructorId === me.id ? <InstructorClassActions session={c} /> : null}
                </View>
              ))}
            </View>
          ))}
        </>
      ) : hasAnyClass ? (
        <EmptyState icon="calendar-outline" title="Nothing on this week" body="Add a class and your followers see it right away." />
      ) : (
        <View style={{ gap: Spacing.lg, marginBottom: Spacing.xxl }}>
          <EmptyState icon="calendar-outline" title="Your stage is empty" />
          <Button icon="add" label="Add my first class" onPress={() => router.push('/schedule/new')} />
        </View>
      )}

      {myPosts.length ? (
        <View style={{ marginTop: Spacing.lg }}>
          <SectionHeader title="Your latest posts" action="See all" onAction={() => router.push('/feed')} />
          {myPosts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', backgroundColor: Colors.surfaceStrong, borderRadius: Radius.pill, padding: 4, marginBottom: Spacing.xl },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: Radius.pill },
  segmentActive: { backgroundColor: Colors.background },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 4 },
  qrButton: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  findButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
    marginBottom: Spacing.xl,
  },
  dayTabs: { flexGrow: 0, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  dayTab: { paddingVertical: Spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  dayTabActive: { borderBottomColor: Colors.primary },
  dayDot: { alignSelf: 'center', width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary, marginTop: 4 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  instructorActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: Spacing.xs,
    justifyContent: 'flex-end',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
  },
});
