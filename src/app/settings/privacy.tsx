import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ConfirmSheet } from '@/components/confirm-sheet';
import { Screen } from '@/components/screen';
import { Button, Card, Icon, Text, type IconName } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';

type Item = { icon: IconName; title: string; body: string };

const forClients: Item[] = [
  { icon: 'gift-outline', title: 'Your birthday', body: 'Only shared if you say yes. Month and day, never the year, and only with instructors you follow.' },
  { icon: 'stats-chart-outline', title: 'Your classes', body: 'An instructor sees the classes you took with them, not your classes with anyone else.' },
  { icon: 'chatbubbles-outline', title: 'Your messages', body: 'Only you and the instructor in the conversation can read them.' },
  { icon: 'person-outline', title: 'Your name', body: 'In the app, instructors see your first name and last initial. Your full name is stored with your profile.' },
];

const forInstructors: Item[] = [
  { icon: 'globe-outline', title: 'Your profile and schedule', body: 'Public, so clients can find you. That includes your name, handle, bio, socials and classes.' },
  { icon: 'document-lock-outline', title: 'Your client notes', body: 'Only you can see them. Clients never do, and neither do other instructors.' },
  { icon: 'chatbubbles-outline', title: 'Your messages', body: 'Only you and the client in the conversation can read them.' },
  { icon: 'diamond-outline', title: 'Premium posts', body: 'Only you and your premium subscribers can open them.' },
];

/** Who sees what, plus deleting your account. */
export default function PrivacySettings() {
  const auth = useAuth();
  const store = useStore();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const live = !auth.demo && !!auth.session;
  const items = store.role === 'instructor' ? forInstructors : forClients;

  const deleteAccount = async () => {
    setBusy(true);
    setError(undefined);
    const res = await auth.deleteAccount();
    setBusy(false);
    if (res.error) setError(res.error);
    else router.replace('/welcome');
  };

  return (
    <Screen padTop={false}>
      <Text variant="body" color="textSecondary">
        Here&apos;s who can see what.
      </Text>

      <View style={{ gap: Spacing.lg, marginTop: Spacing.xl }}>
        {items.map((i) => (
          <View key={i.title} style={styles.item}>
            <Icon name={i.icon} size={20} color="primary" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">{i.title}</Text>
              <Text variant="small" color="textSecondary">
                {i.body}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Card tone="surface" style={{ gap: Spacing.sm, marginTop: Spacing.xxl }}>
        <Text variant="bodyStrong">Delete my account</Text>
        <Text variant="small" color="textSecondary">
          {store.role === 'instructor'
            ? 'Removes your profile, classes, posts, client list, notes and messages for good. This can’t be undone.'
            : 'Removes your profile, birthday, follows, class history and messages for good. This can’t be undone.'}
        </Text>
        {live ? (
          <Button kind="outline" icon="trash-outline" label={busy ? 'Deleting…' : 'Delete my account'} disabled={busy} onPress={() => setConfirm(true)} style={{ marginTop: Spacing.sm }} />
        ) : (
          <Text variant="small" color="textSecondary" style={{ fontStyle: 'italic' }}>
            You&apos;re in preview mode, so there&apos;s no account to delete.
          </Text>
        )}
        {error ? (
          <Text variant="small" color="blushDeep">
            {error}
          </Text>
        ) : null}
      </Card>

      <ConfirmSheet
        open={confirm}
        destructive
        title="Delete your account?"
        body="Everything goes, for good. If you change your mind later you'll need to start a new account."
        confirmLabel="Delete it"
        cancelLabel="Keep my account"
        onConfirm={deleteAccount}
        onClose={() => setConfirm(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
});
