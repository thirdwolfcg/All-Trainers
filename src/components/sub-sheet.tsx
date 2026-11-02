import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { dayLabel, timeLabel } from '@/lib/dates';
import { inviteMessage, shareInvite, textInvite } from '@/lib/invite';
import { useStore } from '@/lib/store';
import { StyleLabels, type ClassSession } from '@/lib/types';

import { Avatar, Button, Chip, Icon, Text } from './ui';

/**
 * Find a sub for one class. Only instructors who teach at the same studio are
 * listed (the database enforces the same rule). When nobody from that studio
 * is on the app yet, the instructor can text them an invite.
 */
export function SubSheet({ session, open, onClose }: { session: ClassSession; open: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const [error, setError] = useState<string>();
  const me = store.instructor(session.instructorId);
  const studio = store.studio(session.studioId);
  if (!me || !studio) return null;

  const colleagues = store.teachersAt(studio.id, me.id);
  const asksForClass = store.subRequests.filter((r) => r.classId === session.id);
  const statusFor = (instructorId: string) =>
    asksForClass
      .filter((r) => r.toInstructorId === instructorId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.status;

  const start = new Date(session.startsAt);
  const message = inviteMessage({ fromName: me.name, fromHandle: me.handle, studioName: studio.name });

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.sm }]}>
        <ScrollView contentContainerStyle={styles.inner}>
          <View style={styles.handle} />
          <Text variant="eyebrow" color="textSecondary">
            Find a sub
          </Text>
          <Text variant="title" style={{ marginTop: 4 }}>
            {session.title}
          </Text>
          <Text variant="small" color="textSecondary" style={{ marginBottom: Spacing.lg }}>
            {dayLabel(start)} at {timeLabel(start)} · {studio.name} · {StyleLabels[session.style]}
          </Text>

          <Text variant="eyebrow" color="textSecondary">
            Your {studio.name} crew on All Trainers
          </Text>

          {colleagues.length === 0 ? (
            <View style={styles.emptyCrew}>
              <Text variant="body">No one from {studio.name} is on here yet.</Text>
              <Text variant="small" color="textSecondary">
                Subs only go to instructors who teach at the same studio, so your clients get the class they signed up for. Invite your coworkers below.
              </Text>
            </View>
          ) : (
            colleagues.map((c) => {
              const status = statusFor(c.id);
              return (
                <View key={c.id} style={styles.person}>
                  <Avatar name={c.name} size={44} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong">{c.name}</Text>
                    <Text variant="small" color="textSecondary">
                      {c.styles.map((s) => StyleLabels[s]).join(' · ')}
                    </Text>
                  </View>
                  {status === 'pending' ? (
                    <Chip label="Asked" icon="time-outline" tone="plum" />
                  ) : status === 'accepted' ? (
                    <Chip label="Covering it" icon="checkmark" tone="mint" />
                  ) : status === 'declined' ? (
                    <Chip label="Can't make it" tone="warn" />
                  ) : (
                    <Button
                      size="sm"
                      kind="primary"
                      label="Ask"
                      accessibilityLabel={`Ask ${c.name} to sub`}
                      onPress={() => {
                        const res = store.requestSub(session.id, c.id);
                        setError(res.error);
                      }}
                    />
                  )}
                </View>
              );
            })
          )}

          {error ? (
            <Text variant="small" color="blushDeep" style={{ marginTop: Spacing.sm }}>
              {error}
            </Text>
          ) : null}

          <View style={styles.invite}>
            <View style={styles.inline}>
              <Icon name="paper-plane-outline" size={16} color="primary" />
              <Text variant="eyebrow" color="primary">
                Bring your studio crew
              </Text>
            </View>
            <Text variant="small" color="textSecondary">
              More {studio.name} instructors on here means more people to cover you. We&apos;ll text them a link to join.
            </Text>
            <View style={styles.inviteButtons}>
              <Button size="sm" kind="ink" icon="chatbubble-outline" label="Text a coworker" onPress={() => textInvite(message)} />
              <Button size="sm" kind="outline" icon="share-outline" label="Share another way" onPress={() => shareInvite(message)} />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(28, 26, 34, 0.35)' },
  sheet: {
    maxHeight: '85%',
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.lg * 2,
    borderTopRightRadius: Radius.lg * 2,
    paddingTop: Spacing.sm,
  },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: Spacing.xl },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderStrong,
    marginBottom: Spacing.lg,
  },
  emptyCrew: { gap: 4, paddingVertical: Spacing.md },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  invite: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
  },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inviteButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 4 },
});
