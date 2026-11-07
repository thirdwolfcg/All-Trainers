import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { isSameDay, startOfDay } from '@/lib/dates';

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** A small month calendar. Past days and days after `maxDate` can't be picked. */
export function DatePicker({ value, onChange, maxDate }: { value: Date; onChange: (d: Date) => void; maxDate?: Date }) {
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];
  while (cells.length % 7) cells.push(null);

  const canBack = month > new Date(today.getFullYear(), today.getMonth(), 1);
  const canForward = !maxDate || new Date(month.getFullYear(), month.getMonth() + 1, 1) <= maxDate;
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Pressable onPress={() => canBack && shift(-1)} disabled={!canBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Previous month">
          <Icon name="chevron-back" size={20} color={canBack ? 'primary' : 'border'} />
        </Pressable>
        <Text variant="bodyStrong">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
        <Pressable onPress={() => canForward && shift(1)} disabled={!canForward} hitSlop={10} accessibilityRole="button" accessibilityLabel="Next month">
          <Icon name="chevron-forward" size={20} color={canForward ? 'primary' : 'border'} />
        </Pressable>
      </View>
      <View style={styles.row}>
        {WEEK.map((d, i) => (
          <Text key={i} variant="caption" color="textSecondary" style={styles.cellText}>
            {d}
          </Text>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={styles.row}>
          {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
            if (!d) return <View key={i} style={styles.cell} />;
            const off = d < today || (!!maxDate && d > maxDate);
            const sel = isSameDay(d, value);
            return (
              <Pressable
                key={i}
                style={styles.cell}
                disabled={off}
                onPress={() => onChange(d)}
                accessibilityRole="button"
                accessibilityState={{ selected: sel, disabled: off }}
                accessibilityLabel={d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}>
                <View style={[styles.day, sel && styles.daySel, !sel && isSameDay(d, today) && styles.dayToday]}>
                  <Text variant="small" color={sel ? 'onPrimary' : off ? 'textMuted' : 'text'} style={off && { opacity: 0.5 }}>
                    {d.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, maxWidth: 360, marginTop: Spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm, paddingHorizontal: 4 },
  row: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  cellText: { flex: 1, textAlign: 'center', paddingVertical: 4 },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  daySel: { backgroundColor: Colors.primary },
  dayToday: { borderWidth: 1, borderColor: Colors.primary },
});
