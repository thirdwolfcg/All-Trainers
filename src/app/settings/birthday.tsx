import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Chip, Field, Icon, Text, type IconName } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
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

  const [share, setShare] = useState<boolean | null>(current ? true : null);
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
    toast(value ? 'Birthday shared. Your instructors will know when to celebrate.' : current ? 'Got it. Your birthday is no longer shared.' : 'Got it. Your birthday stays private.');
    router.back();
  };

  return (
    <Screen padTop={false}>
      <Text variant="title">Share your birthday with instructors you follow?</Text>
      <Text variant="body" color="textSecondary" style={{ marginTop: Spacing.sm }}>
        Totally up to you. If you share it, instructors you follow can wish you a happy birthday. Month and day only, never the year.
      </Text>

      <View style={{ gap: Spacing.sm, marginTop: Spacing.xl }}>
        <Option icon="gift-outline" title="Yes, share it" body="Only instructors you follow will see it." selected={share === true} onPress={() => setShare(true)} />
        <Option icon="lock-closed-outline" title="No thanks" body="Keep it to myself. Nothing is saved." selected={share === false} onPress={() => setShare(false)} />
      </View>

      {share ? (
        <>
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
        </>
      ) : null}

      {error ? (
        <Text variant="small" color="blushDeep" style={{ marginTop: Spacing.md }}>
          {error}
        </Text>
      ) : null}
      <Button
        label={busy ? 'Saving…' : 'Save'}
        icon="checkmark"
        disabled={busy || share === null || (share && !dayOk)}
        onPress={() => (share ? month && save({ month, day: dayNum }) : save(null))}
        style={{ marginTop: Spacing.xxl }}
      />
      <Text variant="small" color="textSecondary" align="center" style={{ marginTop: Spacing.md }}>
        You can change your mind anytime in Me.
      </Text>
    </Screen>
  );
}

function Option({ icon, title, body, selected, onPress }: { icon: IconName; title: string; body: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={title}>
      <View style={[styles.option, selected && styles.optionActive]}>
        <Icon name={icon} size={20} color={selected ? 'primary' : 'textSecondary'} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{title}</Text>
          <Text variant="small" color="textSecondary">
            {body}
          </Text>
        </View>
        <Icon name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={selected ? 'primary' : 'textMuted'} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border },
  optionActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
});
