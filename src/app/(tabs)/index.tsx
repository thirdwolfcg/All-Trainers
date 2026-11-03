import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ClassCard, InstructorRow } from '@/components/cards';
import { ConfirmSheet } from '@/components/confirm-sheet';
import { InstructorClassActions } from '@/components/instructor-class-actions';
import { PreviewSwitch } from '@/components/preview-switch';
import { Screen } from '@/components/screen';
import { Avatar, Button, Card, EmptyState, Icon, SectionHeader, Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { addDays, dayLabel, isSameDay, shortDay, startOfDay } from '@/lib/dates';
import { useMe } from '@/lib/me';
import { useStore } from '@/lib/store';
import { useToast } from '@/lib/toast';

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
  const firstName = me.name.split(' ')[0];
  const [day, setDay] = useState(() => startOfDay(new Date()));

  const followedClasses = useMemo(
    () => store.classes.filter((c) => store.following.has(c.instructorId)),
    [store.classes, store.following],
  );

  const counts = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) =>
      followedClasses.filter((c) => isSameDay(new Date(c.startsAt), addDays(today, i))).length,
    );
  }, [followedClasses]);

  const dayClasses = followedClasses.filter((c) => isSameDay(new Date(c.startsAt), day));
  const today = counts[0];
  const suggestions = store.instructors.filter((i) => !store.following.has(i.id)).slice(0, 3);
  const followingCount = store.following.size;

  return (
    <Screen
      eyebrow={todayEyebrow()}
      title="Where we sweating today?"
      subtitle={
        followingCount === 0
          ? `hiii ${firstName}. Follow a few instructors and their classes land right here.`
          : today
            ? `hiii ${firstName}. ${today === 1 ? 'One of your people is' : `${today} of your people are`} teaching today.`
            : `hiii ${firstName}. Here's where your people are teaching this week.`
      }>
      <PreviewSwitch />
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

      {followingCount === 0 ? (
        <EmptyState icon="heart-outline" title="Your feed is empty (for now)" body="Follow your favorite instructors and every class they teach, at every studio, shows up here." />
      ) : (
        <>
          <SectionHeader title={`Your people · ${followingCount}`} action="Find more" onAction={() => router.push('/discover')} />
          <DayTabs selected={day} onSelect={setDay} counts={counts} />
          <View style={{ marginBottom: Spacing.xxl }}>
            {dayClasses.length ? (
              dayClasses.map((c) => <ClassCard key={c.id} session={c} />)
            ) : (
              <EmptyState icon="cafe-outline" title="Rest day energy" body="None of your people are teaching that day. Pick another day or find someone new." />
            )}
          </View>
        </>
      )}

      {suggestions.length ? (
        <>
          <SectionHeader title="Fresh faces in Denver" action="See all" onAction={() => router.push('/discover')} />
          {suggestions.map((i) => (
            <InstructorRow key={i.id} instructor={i} />
          ))}
        </>
      ) : null}
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
    (c) =>
      (c.instructorId === me.id || c.subInstructorId === me.id) &&
      new Date(c.startsAt) >= today &&
      new Date(c.startsAt) < addDays(today, 7),
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

  const byDay = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i);
    return { day: d, classes: mine.filter((c) => isSameDay(new Date(c.startsAt), d)) };
  }).filter((g) => g.classes.length);

  return (
    <Screen
      eyebrow={todayEyebrow()}
      title={`hiii ${me.name.split(' ')[0]}`}
      subtitle={`${mine.length} classes, ${studiosThisWeek} ${studiosThisWeek === 1 ? 'studio' : 'studios'}, one schedule. You're booked and busy.`}
      right={
        <Pressable onPress={() => router.push('/qr')} style={styles.qrButton} accessibilityRole="button" accessibilityLabel="My QR code">
          <Icon name="qr-code-outline" size={22} color="primary" />
          <Text variant="eyebrow" color="primary" style={{ fontSize: 9 }}>
            My QR
          </Text>
        </Pressable>
      }>
      <PreviewSwitch />
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
                <Pressable
                  style={styles.inline}
                  onPress={() => router.push({ pathname: '/class/[id]', params: { id: cls.id } })}
                  accessibilityRole="link">
                  <Avatar name={from.name} size={32} />
                  <Text variant="body" style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{fromFirst}</Text> needs a sub for {cls.title} at {studio.name},{' '}
                    {dayLabel(start)} at {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
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

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl }}>
        <Button kind="primary" icon="add" label="Add class" accessibilityLabel="Add a class" onPress={() => router.push('/schedule/new')} style={{ flex: 1 }} />
        <Button kind="outline" icon="create-outline" label="Post" accessibilityLabel="Post to your feed" onPress={() => router.push('/post/new')} style={{ flex: 1 }} />
      </View>

      {byDay.length ? (
        byDay.map((g) => (
          <View key={g.day.toISOString()} style={{ marginBottom: Spacing.xl }}>
            <SectionHeader title={dayLabel(g.day)} />
            {g.classes.map((c) => (
              <View key={c.id}>
                <ClassCard session={c} showInstructor={false} />
                {c.instructorId === me.id ? <InstructorClassActions session={c} /> : null}
              </View>
            ))}
          </View>
        ))
      ) : (
        <EmptyState icon="calendar-outline" title="Nothing on the books" body="Add your classes so your people know where to find you." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  instructorActions: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.xs, justifyContent: 'flex-end', marginTop: -Spacing.sm, marginBottom: Spacing.sm },
});
