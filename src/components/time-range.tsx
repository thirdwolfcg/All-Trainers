import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Chip, Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';

const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const toMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const fromMins = (n: number) => {
  const x = ((n % 1440) + 1440) % 1440;
  return `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`;
};
const timeText = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};
const lengthText = (n: number) => (n < 60 ? `${n} min` : n % 60 ? `${Math.floor(n / 60)} hr ${n % 60} min` : `${n / 60} hr`);

/** Pick an hour, minutes and AM or PM. */
function Picker({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const [h24, m] = value.split(':').map(Number);
  const pm = h24 >= 12;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const set = (hour12: number, min: number, isPm: boolean) => onChange(`${(hour12 % 12) + (isPm ? 12 : 0)}:${String(min).padStart(2, '0')}`);
  return (
    <View style={styles.picker}>
      <View style={styles.wrap}>
        <Chip label="AM" selected={!pm} onPress={() => set(h12, m, false)} />
        <Chip label="PM" selected={pm} onPress={() => set(h12, m, true)} />
      </View>
      <Text variant="caption" color="textSecondary">
        HOUR
      </Text>
      <View style={styles.wrap}>
        {HOURS.map((h) => (
          <Chip key={h} label={String(h)} selected={h === h12} onPress={() => set(h, m, pm)} />
        ))}
      </View>
      <Text variant="caption" color="textSecondary">
        MINUTES
      </Text>
      <View style={styles.wrap}>
        {MINUTES.map((x) => (
          <Chip key={x} label={`:${String(x).padStart(2, '0')}`} selected={x === m} onPress={() => set(h12, x, pm)} />
        ))}
      </View>
    </View>
  );
}

/**
 * When the class starts and ends, in one place. The length comes from the two.
 * Changing the start keeps the length; changing the end changes the length.
 */
export function TimeRange({ start, minutes, onChange }: { start: string; minutes: number; onChange: (start: string, minutes: number) => void }) {
  const [open, setOpen] = useState<'start' | 'end' | null>(null);
  const [error, setError] = useState<string>();
  const end = fromMins(toMins(start) + minutes);

  const setEnd = (t: string) => {
    const len = toMins(t) - toMins(start);
    if (len <= 0) return setError('That ends before it starts. Pick a later end time.');
    if (len > 240) return setError('Classes can be up to 4 hours.');
    setError(undefined);
    onChange(start, len);
  };

  const box = (which: 'start' | 'end', label: string, value: string) => (
    <Pressable
      onPress={() => setOpen(open === which ? null : which)}
      style={[styles.box, open === which && styles.boxOpen]}
      accessibilityRole="button"
      accessibilityState={{ expanded: open === which }}
      accessibilityLabel={`${label} ${timeText(value)}. Tap to change.`}>
      <Text variant="caption" color={open === which ? 'primary' : 'textSecondary'}>
        {label.toUpperCase()}
      </Text>
      <Text variant="title">{timeText(value)}</Text>
    </Pressable>
  );

  return (
    <View>
      <View style={styles.row}>
        {box('start', 'Starts', start)}
        <Text variant="body" color="textSecondary">
          to
        </Text>
        {box('end', 'Ends', end)}
      </View>
      <Text variant="small" color={error ? 'blushDeep' : 'textSecondary'} style={{ marginTop: Spacing.sm }}>
        {error ?? `${lengthText(minutes)} class. Tap a time to change it.`}
      </Text>
      {open === 'start' ? (
        <Picker
          value={start}
          onChange={(t) => {
            setError(undefined);
            onChange(t, minutes);
          }}
        />
      ) : open === 'end' ? (
        <Picker value={end} onChange={setEnd} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  box: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: 2,
  },
  boxOpen: { borderColor: Colors.primary, borderWidth: 1.5, backgroundColor: Colors.primarySoft },
  picker: { gap: Spacing.sm, marginTop: Spacing.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
