import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Card, Chip, Field, Icon, Text, type IconName } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { StyleLabels, type Role, type Style } from '@/lib/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const STYLE_OPTIONS: Style[] = ['pilates', 'yoga', 'cycle', 'barre', 'strength', 'hiit', 'dance'];

function RoleCard({ icon, title, body, selected, onPress }: { icon: IconName; title: string; body: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }}>
      <View style={[styles.roleCard, selected && styles.roleCardActive]}>
        <View style={[styles.roleIcon, selected && { backgroundColor: Colors.primary }]}>
          <Icon name={icon} size={22} color={selected ? 'onPrimary' : 'primaryDeep'} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="heading">{title}</Text>
          <Text variant="small" color="textSecondary">
            {body}
          </Text>
        </View>
        <Icon name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? 'primary' : 'textMuted'} />
      </View>
    </Pressable>
  );
}

export default function Onboarding() {
  const { createProfile, signOut, session } = useAuth();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [teach, setTeach] = useState<Style[]>([]);
  const [month, setMonth] = useState<number | null>(null);
  const [day, setDay] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const isInstructor = role === 'instructor';
  const handleOk = /^[a-z0-9_.]{3,30}$/.test(handle);
  const dayNum = Number(day);
  const dayOk = month !== null && Number.isInteger(dayNum) && dayNum >= 1 && dayNum <= DAYS_IN_MONTH[month - 1];

  const finish = async (withBirthday: boolean) => {
    if (!role) return;
    setBusy(true);
    setError(undefined);
    const res = await createProfile({
      role,
      displayName: name,
      handle: isInstructor ? handle : undefined,
      bio: isInstructor ? bio : undefined,
      styles: isInstructor ? teach : [],
      neighborhood,
      birthday: withBirthday && month && dayOk ? { month, day: dayNum } : undefined,
    });
    setBusy(false);
    if (res.error) setError(res.error);
  };

  if (step === 0) {
    return (
      <Screen title="Hi! Who are you here as?" subtitle="You can't switch later without a new account, so pick the one that fits.">
        <View style={{ gap: Spacing.md, marginBottom: Spacing.xxl }}>
          <RoleCard
            icon="heart-outline"
            title="I take classes"
            body="Follow instructors, see their schedules, track your classes."
            selected={role === 'client'}
            onPress={() => setRole('client')}
          />
          <RoleCard
            icon="megaphone-outline"
            title="I teach classes"
            body="Post your schedule once, keep your people close, grow your crew."
            selected={role === 'instructor'}
            onPress={() => setRole('instructor')}
          />
        </View>
        <Button label="Next" disabled={!role} onPress={() => setStep(1)} />
        <Button kind="ghost" label={`Not ${session?.user.email ?? 'you'}? Sign out`} onPress={signOut} style={{ marginTop: Spacing.sm }} />
      </Screen>
    );
  }

  if (step === 1) {
    const canContinue = name.trim().length > 0 && (!isInstructor || (handleOk && teach.length > 0));
    return (
      <Screen title={isInstructor ? 'Set up your profile' : 'What should we call you?'} subtitle={isInstructor ? 'This is what clients see when they find you.' : 'Your instructors will see this name.'}>
        <View style={{ gap: Spacing.lg, marginBottom: Spacing.xxl }}>
          <Field label="Name" value={name} onChangeText={setName} placeholder={isInstructor ? 'Maya Chen' : 'First name and last initial is fine'} autoComplete="name" />
          {isInstructor ? (
            <>
              <Field
                label="Handle"
                value={handle}
                onChangeText={(t) => setHandle(t.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                placeholder="mayamoves"
                autoCapitalize="none"
                hint="Lowercase letters, numbers, dots and underscores. Match your Instagram if you can."
              />
              <View style={{ gap: 6 }}>
                <Text variant="caption" color="textMuted">
                  WHAT YOU TEACH
                </Text>
                <View style={styles.wrap}>
                  {STYLE_OPTIONS.map((s) => (
                    <Chip
                      key={s}
                      label={StyleLabels[s]}
                      selected={teach.includes(s)}
                      onPress={() => setTeach(teach.includes(s) ? teach.filter((x) => x !== s) : [...teach, s])}
                    />
                  ))}
                </View>
              </View>
              <Field label="Bio" value={bio} onChangeText={setBio} placeholder="Your vibe in a sentence or two" multiline style={{ minHeight: 88, paddingTop: 12, textAlignVertical: 'top' }} />
            </>
          ) : null}
          <Field label="Neighborhood" value={neighborhood} onChangeText={setNeighborhood} placeholder="LoHi, RiNo, Wash Park…" hint="Optional. Helps us show classes near you." />
          {error ? (
            <Text variant="small" color="blushDeep">
              {error}
            </Text>
          ) : null}
        </View>
        {isInstructor ? (
          <Button label={busy ? 'Saving…' : 'Finish'} disabled={!canContinue || busy} onPress={() => finish(false)} />
        ) : (
          <Button label="Next" disabled={!canContinue} onPress={() => setStep(2)} />
        )}
        <Button kind="ghost" label="Back" onPress={() => setStep(0)} style={{ marginTop: Spacing.sm }} />
      </Screen>
    );
  }

  return (
    <Screen title="When's your birthday?" subtitle="So your instructors can celebrate you. We only ask for the month and day.">
      <Text variant="caption" color="textMuted" style={{ marginBottom: Spacing.sm }}>
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
      <Button label={busy ? 'Saving…' : 'All set'} disabled={!dayOk || busy} onPress={() => finish(true)} />
      <Button kind="ghost" label="Skip for now" disabled={busy} onPress={() => finish(false)} style={{ marginTop: Spacing.sm }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.xl },
});
