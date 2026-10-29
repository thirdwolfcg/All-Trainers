import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Avatar, Button, Card, Chip, Divider, Icon, Text, type IconName } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { birthdayLabel } from '@/lib/dates';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { StyleLabels, type Role } from '@/lib/types';

function SettingRow({ icon, label, value }: { icon: IconName; label: string; value?: string }) {
  return (
    <View style={styles.setting}>
      <Icon name={icon} size={20} color="textSecondary" />
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      {value ? (
        <Text variant="small" color="textMuted">
          {value}
        </Text>
      ) : null}
      <Icon name="chevron-forward" size={16} color="textMuted" />
    </View>
  );
}

export default function MeScreen() {
  const store = useStore();
  const auth = useAuth();
  const live = !auth.demo && !!auth.profile;
  const isInstructor = store.role === 'instructor';
  const me = isInstructor ? store.instructor(store.meId) : undefined;
  const myClientRecord = store.clients.find((c) => c.id === 'me');

  return (
    <Screen title="Me">
      {live && auth.profile ? (
        <Card tone="plain" style={[styles.profile, { marginBottom: Spacing.md }]}>
          <Avatar name={auth.profile.display_name} size={64} ring />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="title">{auth.profile.display_name}</Text>
            <Text variant="small" color="textSecondary">
              {auth.profile.handle ? `@${auth.profile.handle} · ` : ''}
              {auth.profile.role === 'instructor' ? 'Instructor' : 'Client'} · {auth.session?.user.email}
            </Text>
          </View>
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

      {/* Preview switch, demo only */}
      {auth.demo ? (
      <Card tone="surface" style={{ gap: Spacing.md, marginBottom: Spacing.xl }}>
        <Text variant="caption" color="textMuted">
          PREVIEW MODE
        </Text>
        <View style={styles.segment}>
          {(['client', 'instructor'] as Role[]).map((r) => {
            const active = store.role === r;
            return (
              <Pressable
                key={r}
                onPress={() => {
                  store.setRole(r);
                  router.replace('/');
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.segmentItem, active && styles.segmentActive]}>
                <Text variant="smallStrong" color={active ? 'primaryDeep' : 'textSecondary'}>
                  {r === 'client' ? 'Client view' : 'Instructor view'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text variant="small" color="textSecondary">
          Switch sides to see the app the way clients and instructors will.
        </Text>
      </Card>
      ) : null}

      {live ? null : isInstructor && me ? (
        <Card tone="plain" style={styles.profile}>
          <Avatar name={me.name} size={64} ring />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="title">{me.name}</Text>
            <Text variant="small" color="textSecondary">
              @{me.handle} · {me.styles.map((s) => StyleLabels[s]).join(', ')}
            </Text>
            {me.isFounding ? <Chip label="Founding instructor" icon="sparkles" /> : null}
          </View>
        </Card>
      ) : (
        <Card tone="plain" style={styles.profile}>
          <Avatar name="Lo S." size={64} ring />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="title">Lo S.</Text>
            <Text variant="small" color="textSecondary">
              Following {store.following.size} instructors in Denver
            </Text>
          </View>
        </Card>
      )}

      {isInstructor && me ? (
        <Button
          kind="soft"
          icon="eye-outline"
          label="See my public profile"
          onPress={() => router.push({ pathname: '/instructor/[id]', params: { id: me.id } })}
          style={{ marginVertical: Spacing.lg }}
        />
      ) : (
        <View style={{ height: Spacing.lg }} />
      )}

      <Card tone="plain" style={{ paddingVertical: Spacing.xs }}>
        {isInstructor ? (
          <>
            <SettingRow icon="calendar-outline" label="Calendar sync" value="Google" />
            <Divider />
            <SettingRow icon="diamond-outline" label="Premium for my clients" value="Set up" />
            <Divider />
            <SettingRow icon="card-outline" label="My plan" value={me?.isFounding ? 'Founding, free' : 'Standard'} />
          </>
        ) : (
          <>
            <SettingRow
              icon="gift-outline"
              label="Birthday"
              value={myClientRecord?.birthday ? birthdayLabel(myClientRecord.birthday) : 'Add'}
            />
            <Divider />
            <SettingRow icon="calendar-outline" label="Calendar sync" value="Google" />
            <Divider />
            <SettingRow icon="diamond-outline" label="Premium memberships" value={`${store.premium.size}`} />
          </>
        )}
        <Divider />
        <SettingRow icon="notifications-outline" label="Notifications" value="On" />
        <Divider />
        <SettingRow icon="shield-checkmark-outline" label="Privacy" />
      </Card>

      <Text variant="small" color="textMuted" align="center" style={{ marginTop: Spacing.xl }}>
        Your birthday shows as month and day only, and only to instructors you follow.
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
  segment: { flexDirection: 'row', backgroundColor: Colors.surfaceStrong, borderRadius: Radius.pill, padding: 4 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: Radius.pill },
  segmentActive: { backgroundColor: Colors.background },
  profile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  setting: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 14 },
});
