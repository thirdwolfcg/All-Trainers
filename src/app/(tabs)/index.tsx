import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ClassCard, InstructorRow } from '@/components/cards';
import { Screen } from '@/components/screen';
import { Avatar, Button, Card, Chip, EmptyState, Icon, SectionHeader, Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { addDays, dayLabel, daysUntilBirthday, isSameDay, shortDay, startOfDay } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { StyleLabels, type ClassSession, type Style } from '@/lib/types';

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
            <Text variant={active ? 'bodyStrong' : 'body'} color={active ? 'text' : busy ? 'textSecondary' : 'textMuted'}>
              {i === 0 ? 'Today' : `${shortDay(d)} ${d.getDate()}`}
            </Text>
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
  const auth = useAuth();
  const firstName = (auth.profile?.display_name ?? 'Lo S.').split(' ')[0];
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
  const tonight = counts[0];

  const searching = query.trim().length > 0 || style !== null;
  const q = query.trim().toLowerCase();
  const results = store.instructors.filter((i) => {
    const matchesText =
      !q ||
      i.name.toLowerCase().includes(q) ||
      i.handle.toLowerCase().includes(q) ||
      i.neighborhood.toLowerCase().includes(q) ||
      store.classes.some((c) => c.instructorId === i.id && (store.studio(c.studioId)?.name.toLowerCase().includes(q) ?? false));
    return matchesText && (!style || i.styles.includes(style));
  });

  const discover = store.instructors.filter((i) => !store.following.has(i.id));

  return (
    <Screen
      eyebrow={todayEyebrow()}
      title="Where we sweating today?"
      subtitle={
        tonight
          ? `hiii ${firstName}. ${tonight === 1 ? 'One of your people is' : `${tonight} of your people are`} teaching today.`
          : `hiii ${firstName}. Here's where your people are teaching this week.`
      }>
      <View style={styles.search}>
        <Icon name="search" size={18} color="textSecondary" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Find your people, studios, neighborhoods"
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
            <Icon name="close-circle" size={18} color="textSecondary" />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {allStyles.map((s) => (
          <Chip key={s} label={StyleLabels[s]} selected={style === s} onPress={() => setStyle(style === s ? null : s)} />
        ))}
      </ScrollView>

      {searching ? (
        <View>
          <SectionHeader title={`${results.length} ${results.length === 1 ? 'match' : 'matches'}`} />
          {results.length ? (
            results.map((i) => <InstructorRow key={i.id} instructor={i} />)
          ) : (
            <EmptyState icon="search" title="No one yet" body="Try another name, studio or style. Denver's list grows every week." />
          )}
        </View>
      ) : (
        <>
          <SectionHeader title="Your people" />
          <DayTabs selected={day} onSelect={setDay} counts={counts} />

          <View style={{ marginBottom: Spacing.xxl }}>
            {store.following.size === 0 ? (
              <EmptyState icon="heart-outline" title="Follow your faves" body="Their classes show up here, every studio, one feed." />
            ) : dayClasses.length ? (
              dayClasses.map((c) => <ClassCard key={c.id} session={c} />)
            ) : (
              <EmptyState icon="cafe-outline" title="Rest day energy" body="None of your people are teaching. Pick another day or find someone new." />
            )}
          </View>

          {discover.length ? (
            <>
              <SectionHeader title="Fresh faces in Denver" />
              {discover.map((i) => (
                <InstructorRow key={i.id} instructor={i} />
              ))}
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
      eyebrow={todayEyebrow()}
      title={`hiii ${me.name.split(' ')[0]}`}
      subtitle={`${mine.length} classes, ${studiosThisWeek} ${studiosThisWeek === 1 ? 'studio' : 'studios'}, one schedule. You're booked and busy.`}
      right={<Avatar name={me.name} size={52} ring />}>
      {soonBirthdays.length ? (
        <Card tone="blush" style={{ gap: Spacing.md, marginBottom: Spacing.xl }}>
          <View style={styles.inline}>
            <Icon name="gift-outline" size={18} color="blushDeep" />
            <Text variant="eyebrow" color="blushDeep">
              Birthday szn
            </Text>
          </View>
          {soonBirthdays.map((c) => {
            const n = daysUntilBirthday(c.birthday!);
            return (
              <View key={c.id} style={styles.inline}>
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

      <Button kind="primary" icon="add" label="Add a class" onPress={() => router.push('/schedule/new')} style={{ marginBottom: Spacing.xl }} />

      {byDay.length ? (
        byDay.map((g) => (
          <View key={g.day.toISOString()} style={{ marginBottom: Spacing.xl }}>
            <SectionHeader title={dayLabel(g.day)} />
            {g.classes.map((c) => (
              <View key={c.id}>
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
        <Button size="sm" kind="ghost" label="Bring it back" onPress={() => store.setClassStatus(session.id, 'scheduled')} />
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
      <Button size="sm" kind="ghost" icon="close" label="Cancel my class" onPress={() => store.setClassStatus(session.id, 'cancelled')} />
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text, height: '100%' },
  chips: { gap: Spacing.sm, paddingVertical: Spacing.md, marginBottom: Spacing.lg },
  dayTabs: { flexGrow: 0, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  dayTab: { paddingVertical: Spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  dayTabActive: { borderBottomColor: Colors.primary },
  inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  instructorActions: { flexDirection: 'row', gap: Spacing.xs, justifyContent: 'flex-end', marginTop: -Spacing.sm, marginBottom: Spacing.sm },
});
