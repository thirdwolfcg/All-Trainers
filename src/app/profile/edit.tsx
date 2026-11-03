import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Card, Chip, EmptyState, Field, Icon, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { StyleLabels, type Style } from '@/lib/types';

const STYLE_OPTIONS: Style[] = ['pilates', 'yoga', 'cycle', 'barre', 'strength', 'hiit', 'dance'];
const cleanHandle = (t: string) => t.replace(/[^A-Za-z0-9_.@]/g, '').replace(/^@+/, '');

/** Instructors edit what clients see on their profile. */
export default function EditProfile() {
  const store = useStore();
  const auth = useAuth();
  const toast = useToast();
  const me = store.instructor(store.meId);

  const [name, setName] = useState(me?.name ?? '');
  const [handle, setHandle] = useState(me?.handle ?? '');
  const [bio, setBio] = useState(me?.bio ?? '');
  const [neighborhood, setNeighborhood] = useState(me?.neighborhood ?? '');
  const [teach, setTeach] = useState<Style[]>(me?.styles ?? []);
  const [instagram, setInstagram] = useState(me?.instagram ?? '');
  const [tiktok, setTiktok] = useState(me?.tiktok ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (!me || store.role !== 'instructor') {
    return (
      <Screen padTop={false}>
        <EmptyState icon="person-outline" title="For instructors" body="Instructors can edit their public profile here." />
      </Screen>
    );
  }

  const handleOk = /^[a-z0-9_.]{3,30}$/.test(handle);
  const handleChanged = handle !== me.handle;
  const canSave = name.trim().length > 0 && handleOk && teach.length > 0 && !busy;

  const save = async () => {
    setBusy(true);
    setError(undefined);
    const edits = {
      name: name.trim(),
      handle,
      bio: bio.trim(),
      neighborhood: neighborhood.trim(),
      styles: teach,
      instagram: instagram.trim() || undefined,
      tiktok: tiktok.trim() || undefined,
    };
    if (auth.session && auth.profile) {
      const res = await auth.updateProfile({ ...edits, displayName: edits.name });
      if (res.error) {
        setBusy(false);
        setError(res.error);
        return;
      }
    }
    store.updateInstructor(me.id, edits);
    setBusy(false);
    toast('Profile updated. Looking good.');
    router.back();
  };

  return (
    <Screen padTop={false}>
      <Text variant="body" color="textSecondary">
        This is what clients see when they find you.
      </Text>

      <View style={{ marginTop: Spacing.xl, gap: Spacing.xl }}>
        <Field label="Name" value={name} onChangeText={setName} placeholder="Maya Chen" autoComplete="name" maxLength={60} />
        <Field
          label="Handle"
          value={handle}
          onChangeText={(t) => setHandle(t.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
          autoCapitalize="none"
          maxLength={30}
          hint="Lowercase letters, numbers, dots and underscores."
          error={handle && !handleOk ? 'Handles are 3 to 30 characters.' : undefined}
        />
        {handleChanged && handleOk ? (
          <Card tone="warn" style={styles.warn}>
            <Icon name="alert-circle-outline" size={18} color="warnDeep" />
            <Text variant="small" color="warnDeep" style={{ flex: 1 }}>
              Your QR code and shared links use your handle. If you change it, QR codes you already printed or posted will stop working.
            </Text>
          </Card>
        ) : null}
        <Field
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Your vibe in a sentence or two"
          multiline
          maxLength={300}
          style={{ minHeight: 96, paddingTop: 12, textAlignVertical: 'top' }}
        />
        <View style={{ gap: 6 }}>
          <Text variant="caption" color="textSecondary">
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
          {teach.length === 0 ? (
            <Text variant="small" color="blushDeep">
              Pick at least one.
            </Text>
          ) : null}
        </View>
        <Field label="Neighborhood" value={neighborhood} onChangeText={setNeighborhood} placeholder="LoHi, RiNo, Wash Park…" />
        <Field label="Instagram" value={instagram} onChangeText={(t) => setInstagram(cleanHandle(t))} placeholder="@yourhandle" autoCapitalize="none" hint="Optional." />
        <Field label="TikTok" value={tiktok} onChangeText={(t) => setTiktok(cleanHandle(t))} placeholder="@yourhandle" autoCapitalize="none" hint="Optional." />
      </View>

      {error ? (
        <Text variant="small" color="blushDeep" style={{ marginTop: Spacing.lg }}>
          {error}
        </Text>
      ) : null}
      <Button label={busy ? 'Saving…' : 'Save'} icon="checkmark" disabled={!canSave} onPress={save} style={{ marginTop: Spacing.xxl }} />
      <Button kind="ghost" label="Cancel" onPress={() => router.back()} style={{ marginTop: Spacing.sm }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  warn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
});
