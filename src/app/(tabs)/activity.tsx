import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Avatar, Card, Chip, EmptyState, Icon, SectionHeader, Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { daysUntilBirthday, sinceLabel } from '@/lib/dates';
import { useStore } from '@/lib/store';

export default function ActivityScreen() {
  const { role } = useStore();
  return role === 'instructor' ? <ClientList /> : <ClassTracker />;
}

/* ---------- Client: class tracker ---------- */

function Bar({ label, sub, value, max }: { label: string; sub?: string; value: number; max: number }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.barLabel}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{label}</Text>
          {sub ? (
            <Text variant="small" color="textMuted">
              {sub}
            </Text>
          ) : null}
        </View>
        <Text variant="heading" color="primaryDeep">
          {value}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(6, (value / max) * 100)}%` }]} />
      </View>
    </View>
  );
}

function ClassTracker() {
  const store = useStore();
  const mine = store.attendance.filter((a) => a.clientId === 'me');

  const now = new Date();
  const thisMonth = mine.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const byInstructor = useMemo(() => countBy(mine.map((a) => a.instructorId)), [mine]);
  const byStudio = useMemo(() => countBy(mine.map((a) => a.studioId)), [mine]);
  const maxI = Math.max(1, ...byInstructor.map(([, n]) => n));
  const maxS = Math.max(1, ...byStudio.map(([, n]) => n));
  const top = byInstructor[0];

  return (
    <Screen title="My classes" subtitle="Every class counts. Literally, we count them.">
      {mine.length === 0 ? (
        <EmptyState icon="stats-chart-outline" title="Your tracker starts here" body="Tap 'I went' after a class and it shows up here, by instructor and by studio." />
      ) : (
        <>
          <View style={styles.stats}>
            <Card tone="purple" style={styles.stat}>
              <Text variant="display" color="primaryDeep">
                {mine.length}
              </Text>
              <Text variant="smallStrong" color="primaryDeep">
                classes total
              </Text>
            </Card>
            <Card tone="surface" style={styles.stat}>
              <Text variant="display">{thisMonth}</Text>
              <Text variant="smallStrong" color="textSecondary">
                this month
              </Text>
            </Card>
          </View>

          {top ? (
            <Card tone="blush" style={[styles.row, { marginBottom: Spacing.xl }]}>
              <Icon name="heart" size={20} color="blushDeep" />
              <Text variant="body" style={{ flex: 1 }}>
                You&apos;ve taken <Text variant="bodyStrong">{top[1]} classes</Text> with{' '}
                {store.instructor(top[0])?.name.split(' ')[0]}. That&apos;s your person.
              </Text>
            </Card>
          ) : null}

          <SectionHeader title="By instructor" />
          <View style={styles.bars}>
            {byInstructor.map(([id, n]) => {
              const i = store.instructor(id);
              return <Bar key={id} label={i?.name ?? 'Instructor'} value={n} max={maxI} />;
            })}
          </View>

          <SectionHeader title="By studio" />
          <View style={styles.bars}>
            {byStudio.map(([id, n]) => {
              const s = store.studio(id);
              return <Bar key={id} label={s?.name ?? 'Studio'} sub={s?.neighborhood} value={n} max={maxS} />;
            })}
          </View>
        </>
      )}
    </Screen>
  );
}

function countBy(ids: string[]) {
  const m = new Map<string, number>();
  ids.forEach((id) => m.set(id, (m.get(id) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

/* ---------- Instructor: client list ---------- */

function ClientList() {
  const store = useStore();
  const [query, setQuery] = useState('');

  const rows = store.clients
    .map((c) => {
      const visits = store.attendance.filter((a) => a.clientId === c.id && a.instructorId === store.meId);
      const last = visits.map((v) => v.date).sort().at(-1);
      return { client: c, count: visits.length, last };
    })
    .filter((r) => r.client.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => b.count - a.count);

  return (
    <Screen title="Clients" subtitle={`${store.clients.length} people follow you. Everyone who follows lands here.`}>
      <View style={styles.search}>
        <Icon name="search" size={18} color="textMuted" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search clients"
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
        />
      </View>

      <View style={{ gap: Spacing.sm }}>
        {rows.map(({ client, count, last }) => {
          const bday = client.birthday ? daysUntilBirthday(client.birthday) : null;
          return (
            <Card
              key={client.id}
              tone="plain"
              onPress={() => router.push({ pathname: '/client/[id]', params: { id: client.id } })}
              style={styles.clientRow}>
              <Avatar name={client.name} size={46} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="heading">{client.name}</Text>
                <Text variant="small" color="textSecondary">
                  {count} {count === 1 ? 'class' : 'classes'} with you
                  {last ? ` · last class ${sinceLabel(last)}` : ' · new follower'}
                </Text>
                <View style={styles.tagRow}>
                  {client.isPremium ? <Chip label="Premium" icon="diamond-outline" tone="blush" /> : null}
                  {bday !== null && bday <= 7 ? (
                    <Chip label={bday === 0 ? 'Birthday today' : `Birthday in ${bday}d`} icon="gift-outline" tone="warn" />
                  ) : null}
                </View>
              </View>
              <Icon name="chevron-forward" size={18} color="textMuted" />
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  stat: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bars: { gap: Spacing.lg, marginBottom: Spacing.xxl },
  barLabel: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md },
  track: { height: 8, borderRadius: 4, backgroundColor: Colors.surfaceStrong, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: Colors.primary },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    height: 46,
    marginBottom: Spacing.lg,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text, height: '100%' },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
