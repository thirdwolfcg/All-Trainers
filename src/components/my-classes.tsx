import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, EmptyState, Icon, SectionHeader, Text } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { useStore } from '@/lib/store';

/* ---------- Client: class tracker ---------- */

function Bar({ label, sub, value, max, onPress }: { label: string; sub?: string; value: number; max: number; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'link' : undefined} style={{ gap: 6 }}>
      <View style={styles.barLabel}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{label}</Text>
          {sub ? (
            <Text variant="small" color="textSecondary">
              {sub}
            </Text>
          ) : null}
        </View>
        <Text variant="heading" color="primaryDeep">
          {value}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value ? Math.max(6, (value / max) * 100) : 0}%` }]} />
      </View>
    </Pressable>
  );
}

/** The client's class stats: totals, by instructor, by studio. Shown on Home under "My classes". */
export function MyClassesPanel() {
  const store = useStore();
  const mine = store.attendance.filter((a) => a.clientId === 'me');

  // Rolling 30 days reads better than a calendar month on the 2nd of the month.
  const last30 = mine.filter((a) => Date.now() - new Date(a.date).getTime() <= 30 * 24 * 60 * 60 * 1000).length;

  // Everyone you follow shows up, even before your first class with them.
  const byInstructor = useMemo(() => {
    const counted = countBy(mine.map((a) => a.instructorId));
    const seen = new Set(counted.map(([id]) => id));
    const followedNotYet = [...store.following].filter((id) => !seen.has(id)).map((id) => [id, 0] as [string, number]);
    return [...counted, ...followedNotYet];
  }, [mine, store.following]);
  const byStudio = useMemo(() => countBy(mine.map((a) => a.studioId)), [mine]);
  const maxI = Math.max(1, ...byInstructor.map(([, n]) => n));
  const maxS = Math.max(1, ...byStudio.map(([, n]) => n));
  const top = byInstructor[0];

  return (
    <>
      {mine.length === 0 ? (
        <>
          <EmptyState icon="stats-chart-outline" title="Your era starts here" body="Tap 'I went' after a class and it shows up here, by instructor and by studio." />
          {byInstructor.length ? (
            <>
              <SectionHeader title={`Your instructors · ${byInstructor.length}`} />
              <View style={styles.bars}>
                {byInstructor.map(([id, n]) => {
                  const i = store.instructor(id);
                  return (
                    <Bar
                      key={id}
                      label={i?.name ?? 'Instructor'}
                      sub={n ? undefined : 'No classes logged yet'}
                      value={n}
                      max={1}
                      onPress={() => router.push({ pathname: '/instructor/[id]', params: { id } })}
                    />
                  );
                })}
              </View>
            </>
          ) : null}
        </>
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
              <Text variant="display">{last30}</Text>
              <Text variant="smallStrong" color="textSecondary">
                last 30 days
              </Text>
            </Card>
          </View>

          {top ? (
            <Card tone="gray" style={[styles.row, { marginBottom: Spacing.xl }]}>
              <Icon name="heart" size={20} color="primary" />
              <Text variant="body" style={{ flex: 1 }}>
                You&apos;ve taken <Text variant="bodyStrong">{top[1]} classes</Text> with{' '}
                {store.instructor(top[0])?.name.split(' ')[0]}. That&apos;s your person.
              </Text>
            </Card>
          ) : null}

          <SectionHeader title={`Your instructors · ${byInstructor.length}`} />
          <View style={styles.bars}>
            {byInstructor.map(([id, n]) => {
              const i = store.instructor(id);
              return (
                <Bar
                  key={id}
                  label={i?.name ?? 'Instructor'}
                  sub={n ? undefined : 'No classes logged yet'}
                  value={n}
                  max={maxI}
                  onPress={() => router.push({ pathname: '/instructor/[id]', params: { id } })}
                />
              );
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
    </>
  );
}

function countBy(ids: string[]) {
  const m = new Map<string, number>();
  ids.forEach((id) => m.set(id, (m.get(id) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}


const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  stat: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bars: { gap: Spacing.lg, marginBottom: Spacing.xxl },
  barLabel: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md },
  track: { height: 8, borderRadius: 4, backgroundColor: Colors.surfaceStrong, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: Colors.primary },
});
