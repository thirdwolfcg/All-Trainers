import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Avatar, Button, Card, Chip, Divider, Icon, Text, type IconName } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { birthdayLabel } from '@/lib/dates';
import { InviteCard } from '@/components/invite-card';
import { useAuth } from '@/lib/auth';
import { friendInviteMessage, instructorInviteMessage } from '@/lib/invite';
import { useMe } from '@/lib/me';
import { useStore } from '@/lib/store';
import { StyleLabels } from '@/lib/types';

/** A settings line. Ones that don't work yet say so instead of pretending to be tappable. */
function SettingRow({ icon, label, value, onPress }: { icon: IconName; label: string; value?: string; onPress?: () => void }) {
  const body = (
    <>
      <Icon name={icon} size={20} color="textSecondary" />
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      {value ? (
        <Text variant="small" color="textSecondary">
          {value}
        </Text>
      ) : null}
      {onPress ? <Icon name="chevron-forward" size={16} color="textSecondary" /> : <Chip label="Soon" />}
    </>
  );
  if (!onPress) return <View style={styles.setting}>{body}</View>;
  return (
    <Pressable onPress={onPress} style={styles.setting} accessibilityRole="button">
      {body}
    </Pressable>
  );
}

export default function MeScreen() {
  const store = useStore();
  const auth = useAuth();
  const meInfo = useMe();
  const live = !auth.demo && !!auth.profile;
  const isInstructor = store.role === 'instructor';
  const me = isInstructor ? store.instructor(store.meId) : undefined;
  const myClientRecord = store.clients.find((c) => c.id === 'me');
  const myBirthday = live ? auth.birthday : myClientRecord?.birthday;

  return (
    <Screen eyebrow="Account" title="Me">
      {live && auth.profile ? (
        <Card
          tone="plain"
          style={[styles.profile, { marginBottom: Spacing.md }]}
          onPress={() =>
            auth.profile?.role === 'instructor' ? router.push({ pathname: '/instructor/[id]', params: { id: store.meId } }) : router.push('/profile/edit')
          }>
          <Avatar name={auth.profile.display_name} size={64} ring />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="title">{auth.profile.display_name}</Text>
            <Text variant="small" color="textSecondary">
              {auth.profile.handle ? `@${auth.profile.handle} · ` : ''}
              {auth.profile.role === 'instructor' ? 'Instructor' : 'Client'} · {auth.session?.user.email}
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color="textSecondary" />
        </Card>
      ) : null}

      {live ? (
        <Card tone="warn" style={{ gap: 4, marginBottom: Spacing.xl }}>
          <Text variant="smallStrong" color="warnDeep">
            You&apos;re signed in for real
          </Text>
          <Text variant="small" color="warnDeep">
            Your account is saved. The rest of the app still shows sample people until the next build step.
          </Text>
        </Card>
      ) : null}


      {live ? null : isInstructor && me ? (
        <Card tone="plain" style={styles.profile} onPress={() => router.push({ pathname: '/instructor/[id]', params: { id: me.id } })}>
          <Avatar name={me.name} size={64} ring />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="title">{me.name}</Text>
            <Text variant="small" color="textSecondary">
              @{me.handle} · {me.styles.map((s) => StyleLabels[s]).join(', ')}
            </Text>
            {me.isFounding ? <Chip label="Founding instructor" icon="sparkles" /> : null}
          </View>
          <Icon name="chevron-forward" size={18} color="textSecondary" />
        </Card>
      ) : (
        <Card tone="plain" style={styles.profile} onPress={() => router.push('/profile/edit')}>
          <Avatar name={meInfo.name} size={64} ring />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="title">{meInfo.name}</Text>
            <Text variant="small" color="textSecondary">
              Following {store.following.size} instructors in Denver
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color="textSecondary" />
        </Card>
      )}

      {isInstructor && me ? (
        <Button
          kind="soft"
          icon="eye-outline"
          label="See my profile like clients do"
          onPress={() => router.push({ pathname: '/instructor/[id]', params: { id: me.id } })}
          style={{ marginVertical: Spacing.lg }}
        />
      ) : (
        <View style={{ height: Spacing.lg }} />
      )}

      {!isInstructor ? (
        <View style={{ gap: Spacing.md, marginBottom: Spacing.xl }}>
          <InviteCard
            eyebrow="Bring your people"
            title="Invite a friend"
            body="Workout buddies keep each other honest. Send them the app."
            message={friendInviteMessage({ fromName: meInfo.name, refId: meInfo.refId })}
            icon="people-outline"
            textLabel="Text a friend"
          />
          <InviteCard
            eyebrow="Missing someone?"
            title="Invite an instructor"
            body="Love a teacher who isn't on here yet? Founding instructors join free."
            message={instructorInviteMessage({ fromName: meInfo.name, refId: meInfo.refId })}
            icon="heart-outline"
            textLabel="Text my instructor"
          />
        </View>
      ) : null}

      <Card tone="plain" style={{ paddingVertical: Spacing.xs }}>
        {isInstructor ? (
          <>
            <SettingRow icon="create-outline" label="Edit profile" onPress={() => router.push('/profile/edit')} />
            <SettingRow icon="qr-code-outline" label="My QR code" onPress={() => router.push('/qr')} />
            <Divider />
            <SettingRow icon="calendar-outline" label="Calendar sync" />
            <Divider />
            <SettingRow icon="diamond-outline" label="Premium for my clients" />
            <Divider />
            <SettingRow icon="card-outline" label="My plan" value={me?.isFounding ? 'Founding, free' : 'Standard'} />
          </>
        ) : (
          <>
            <SettingRow icon="create-outline" label="Edit profile" onPress={() => router.push('/profile/edit')} />
            <Divider />
            <SettingRow
              icon="gift-outline"
              label="Birthday"
              value={myBirthday ? `Shared · ${birthdayLabel(myBirthday)}` : 'Not shared'}
              onPress={() => router.push('/settings/birthday')}
            />
            <Divider />
            <SettingRow icon="calendar-outline" label="Calendar sync" />
            <Divider />
            <SettingRow icon="diamond-outline" label="Premium memberships" value={`${store.premium.size}`} />
          </>
        )}
        <Divider />
        <SettingRow icon="notifications-outline" label="Notifications" />
        <Divider />
        <SettingRow icon="shield-checkmark-outline" label="Privacy" onPress={() => router.push('/settings/privacy')} />
        <Divider />
        <SettingRow
          icon="bulb-outline"
          label="Show tips again"
          onPress={() => {
            store.showTips();
            router.replace('/');
          }}
        />
      </Card>

      <Text variant="small" color="textSecondary" align="center" style={{ marginTop: Spacing.xl }}>
        Your birthday is only shared if you say yes, as month and day, with instructors you follow.
      </Text>

      {auth.demo ? (
        <Button kind="outline" label="Exit demo" onPress={auth.exitDemo} style={{ marginTop: Spacing.xl }} />
      ) : (
        <Button kind="outline" icon="log-out-outline" label="Sign out" onPress={auth.signOut} style={{ marginTop: Spacing.xl }} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  setting: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 14 },
});
