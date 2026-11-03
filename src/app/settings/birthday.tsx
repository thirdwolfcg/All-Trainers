import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Card, Chip, Field, Icon, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { useToast } from '@/lib/toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Add, change or remove your birthday (month and day only). */
export default function BirthdaySettings() {
  const auth = useAuth();
  const store = useStore();
  const toast = useToast();
  const live = !auth.demo && !!auth.session;
  const current = live ? auth.birthday : store.clients.find((c) => c.id === 'me')?.birthday;

  const [month, setMonth] = useState<number | null>(current?.month ?? null);
  const [day, setDay] = useState(current?.day ? String(current.day) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const dayNum = Number(day);
  const dayOk = month !== null && Number.isInteger(dayNum) && dayNum >= 1 && dayNum <= DAYS_IN_MONTH[month - 1];

  const save = async (value: { month: number; day: number } | null) => {
    setBusy(true);
    setError(undefined);
    if (live) {
      const res = await auth.saveBirthday(value);
      if (res.error) {
        setBusy(false);
        setError(res.error);
        return;
      }
    } else {
      store.updateClient('me', { birthday: value ?? undefined });
    }
    setBusy(false);
    toast(value ? 'Birthday saved. Your instructors will know when to celebrate.' : 'Birthday removed.');
    router.back();
  };

  return (
    <Screen padTop={false}>
      <Text variant="body" color="textSecondary">
        So your instructors can celebrate you. Month and day only.
      </Text>

      <Text variant="caption" color="textSecondary" style={{ marginTop: Spacing.xl, marginBottom: Spacing.sm }}>
        MONTH
      </Text>
      <View style={[styles.wrap, { marginBottom: Spacing.xl }]}>
        {MONTHS.map((m, i) => (
          <Chip key={m} label={m} selected={month === i + 1} onPress={() => setMonth(i + 1)} />
        ))}
      </View>
      <Field
        label="Day"
        value={day}
        onChangeText={(t) => setDay(t.replace(/\D/g, '').slice(0, 2))}
        placeholder="17"
        keyboardType="number-pad"
        style={{ width: 96 }}
        error={day && month && !dayOk ? 'That day doesn’t exist in that month.' : undefined}
      />

      <Card tone="surface" style={styles.privacy}>
        <Icon name="lock-closed-outline" size={18} color="textSecondary" />
        <Text variant="small" color="textSecondary" style={{ flex: 1 }}>
          No year, no age. Only instructors you follow can see it.
        </Text>
      </Card>

      {error ? (
        <Text variant="small" color="blushDeep" style={{ marginBottom: Spacing.md }}>
          {error}
        </Text>
      ) : null}
      <Button label={busy ? 'Saving…' : 'Save'} icon="checkmark" disabled={!dayOk || busy} onPress={() => month && save({ month, day: dayNum })} />
      {current ? (
        <Button kind="ghost" label="Remove my birthday" disabled={busy} onPress={() => save(null)} style={{ marginTop: Spacing.sm }} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.xl },
});
