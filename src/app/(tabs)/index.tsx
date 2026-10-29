import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ClassCard, InstructorRow } from '@/components/cards';
import { Screen } from '@/components/screen';
import { Avatar, Button, Card, Chip, EmptyState, Icon, SectionHeader, Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { addDays, dayLabel, daysUntilBirthday, isSameDay, shortDay, startOfDay } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { StyleLabels, type ClassSession, type Style } from '@/lib/types';

export default function HomeScreen() {
  const { role } = useStore();
  return role === 'instructor' ? <InstructorWeek /> : <ClientHome />;
}

/* ---------- Day picker ---------- */

function DayStrip({ selected, onSelect, counts }: { selected: Date; onSelect: (d: Date) => void; counts: number[] }) {
  const today = startOfDay(new Date());
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
      {Array.from({ length: 7 }, (_, i) => {
        const d = addDays(today, i);
        const active = isSameDay(d, selected);
        return (
          <Pressable
            key={i}
            onPress={() => onSelect(d)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.day, active && styles.dayActive]}>
            <Text variant="caption" color={active ? 'onPrimary' : 'textMuted'}>
              {i === 0 ? 'TODAY' : shortDay(d).toUpperCase()}
            </Text>
            <Text variant="title" color={active ? 'onPrimary' : 'text'}>
              {d.getDate()}
            </Text>
            <View style={[styles.dot, { opacity: counts[i] ? 1 : 0 }, active && { backgroundColor: Colors.onPrimary }]} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ---------- Client home ---------- */

const allStyles: Style[] = ['pilates', 'yoga', 'cycle', 'barre', 'strength', 'hiit', 'dance'];

function ClientHome() {
  const store = useStore();
  const [day, setDay] = useState(() => startOfDay(new Date()));
  const [query, setQuery] = useState('');
  const [style, setStyle] = useState<Style | null>(null);

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

  const searching = query.trim().length > 0 || style !== null;
  const q = query.trim().toLowerCase();
  const results = store.instructors.filter((i) => {
    const matchesText =
      !q ||
      i.name.toLowerCase().includes(q) ||
      i.handle.toLowerCase().includes(q) ||
      i.neighborhood.toLowerCase().includes(q) ||
      store.classes.some(
        (c) => c.instructorId === i.id && (store.studio(c.studioId)?.name.toLowerCase().includes(q) ?? false),
      );
    const matchesStyle = !style || i.styles.includes(style);
    return matchesText && matchesStyle;
  });

  const discover = store.instructors.filter((i) => !store.following.has(i.id));

  return (
    <Screen title="Hey Lo" subtitle="Here's where your people are teaching this week.">
      <View style={styles.search}>
        <Icon name="search" size={18} color="textMuted" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search instructors, studios, neighborhoods"
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
            <Icon name="close-circle" size={18} color="textMuted" />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {allStyles.map((s) => (
          <Chip key={s} label={StyleLabels[s]} selected={style === s} onPress={() => setStyle(style === s ? null : s)} />
        ))}
      </ScrollView>

      {searching ? (
        <View style={{ gap: Spacing.md }}>
          <Text variant="smallStrong" color="textSecondary">
            {results.length} {results.length === 1 ? 'instructor' : 'instructors'}
          </Text>
          {results.length ? (
            results.map((i) => <InstructorRow key={i.id} instructor={i} />)
          ) : (
            <EmptyState icon="search" title="No one yet" body="Try another name, studio or style. Denver's list grows every week." />
          )}
        </View>
      ) : (
        <>
          <SectionHeader title="Your instructors" />
          <DayStrip selected={day} onSelect={setDay} counts={counts} />

          <Text variant="smallStrong" color="textSecondary" style={{ marginBottom: Spacing.md }}>
            {dayLabel(day)}
          </Text>

          <View style={{ gap: Spacing.md, marginBottom: Spacing.xxl }}>
            {store.following.size === 0 ? (
              <EmptyState icon="heart-outline" title="Follow your favorites" body="Their classes show up here, across every studio they teach at." />
            ) : dayClasses.length ? (
              dayClasses.map((c) => <ClassCard key={c.id} session={c} />)
            ) : (
              <EmptyState icon="cafe-outline" title="Rest day energy" body="None of your instructors are teaching this day. Pick another day or find someone new." />
            )}
          </View>

          {discover.length ? (
            <>
              <SectionHeader title="New to you in Denver" />
              <View style={{ gap: Spacing.md }}>
                {discover.map((i) => (
                  <InstructorRow key={i.id} instructor={i} />
                ))}
              </View>
            </>
          ) : null}
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
  const mine = store.classes.filter(
    (c) => c.instructorId === me.id && new Date(c.startsAt) >= today && new Date(c.startsAt) < addDays(today, 7),
  );
  const studiosThisWeek = new Set(mine.map((c) => c.studioId)).size;

  const soonBirthdays = store.clients
    .filter((c) => c.birthday && daysUntilBirthday(c.birthday) <= 7)
    .sort((a, b) => daysUntilBirthday(a.birthday!) - daysUntilBirthday(b.birthday!));

  const byDay = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i);
    return { day: d, classes: mine.filter((c) => isSameDay(new Date(c.startsAt), d)) };
  }).filter((g) => g.classes.length);

  return (
    <Screen
      title={`Hey ${me.name.split(' ')[0]}`}
      subtitle={`${mine.length} classes across ${studiosThisWeek} ${studiosThisWeek === 1 ? 'studio' : 'studios'} this week.`}
      right={<Avatar name={me.name} size={44} ring />}>
      {soonBirthdays.length ? (
        <Card tone="blush" style={{ gap: Spacing.md, marginBottom: Spacing.xl }}>
          <View style={styles.row}>
            <Icon name="gift-outline" size={20} color="blushDeep" />
            <Text variant="heading" color="blushDeep">
              Birthdays coming up
            </Text>
          </View>
          {soonBirthdays.map((c) => {
            const n = daysUntilBirthday(c.birthday!);
            return (
              <View key={c.id} style={styles.row}>
                <Avatar name={c.name} size={32} />
                <Text variant="body" style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{c.name.split(' ')[0]}</Text>
                  {n === 0 ? ' is celebrating today' : n === 1 ? ' tomorrow' : ` in ${n} days`}
                </Text>
                <Button
                  size="sm"
                  kind="outline"
                  label="Send love"
                  onPress={() => {
                    const conv = store.conversationWith(me.id, c.id);
                    router.push({ pathname: '/chat/[id]', params: { id: conv.id } });
                  }}
                />
              </View>
            );
          })}
        </Card>
      ) : null}

      <Button icon="add" label="Add a class" onPress={() => router.push('/schedule/new')} style={{ marginBottom: Spacing.xl }} />

      {byDay.length ? (
        byDay.map((g) => (
          <View key={g.day.toISOString()} style={{ marginBottom: Spacing.xl, gap: Spacing.md }}>
            <Text variant="smallStrong" color="textSecondary">
              {dayLabel(g.day)}
            </Text>
            {g.classes.map((c) => (
              <View key={c.id} style={{ gap: Spacing.sm }}>
                <ClassCard session={c} showInstructor={false} />
                <InstructorClassActions session={c} />
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

function InstructorClassActions({ session }: { session: ClassSession }) {
  const store = useStore();
  if (session.status === 'cancelled') {
    return (
      <View style={styles.instructorActions}>
        <Button size="sm" kind="ghost" label="Restore class" onPress={() => store.setClassStatus(session.id, 'scheduled')} />
      </View>
    );
  }
  return (
    <View style={styles.instructorActions}>
      {session.status === 'sub_needed' ? (
        <Button size="sm" kind="ghost" icon="checkmark" label="Sub found" onPress={() => store.setClassStatus(session.id, 'subbed')} />
      ) : (
        <Button size="sm" kind="ghost" icon="swap-horizontal" label="Need a sub" onPress={() => store.setClassStatus(session.id, 'sub_needed')} />
      )}
      <Button size="sm" kind="ghost" icon="close" label="Cancel" onPress={() => store.setClassStatus(session.id, 'cancelled')} />
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text, height: '100%' },
  chips: { gap: Spacing.sm, paddingVertical: Spacing.md, marginBottom: Spacing.md },
  dayStrip: { gap: Spacing.sm, paddingBottom: Spacing.lg },
  day: {
    width: 56,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.surface,
  },
  dayActive: { backgroundColor: Colors.primary },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  instructorActions: { flexDirection: 'row', gap: Spacing.xs, justifyContent: 'flex-end', marginTop: -Spacing.xs },
});
