import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import type { ReportReason, ReportTarget } from '@/lib/types';

import { ConfirmSheet } from './confirm-sheet';
import { Button, Field, Icon, Text, type IconName } from './ui';

const REASONS: { reason: ReportReason; label: string; hint: string }[] = [
  { reason: 'harassment', label: 'Harassment or bullying', hint: 'Mean, threatening or targeting someone' },
  { reason: 'inappropriate', label: 'Inappropriate content', hint: 'Sexual, violent, hateful or graphic' },
  { reason: 'spam', label: 'Spam or scam', hint: 'Ads, fake offers, repeated junk' },
  { reason: 'impersonation', label: 'Pretending to be someone', hint: 'A fake instructor or account' },
  { reason: 'safety', label: 'Safety concern', hint: 'Dangerous advice or someone at risk' },
  { reason: 'other', label: 'Something else', hint: 'Tell us below' },
];

const NOUN: Record<ReportTarget, string> = { post: 'post', profile: 'profile', message: 'message', class: 'class' };

/**
 * The ⋯ button on posts, profiles, chats and client pages: Report (to Zomi)
 * and Block or Unblock the person. Both stores require these for apps where
 * people post and message each other.
 */
export function SafetyMenu({
  targetType,
  targetId,
  personId,
  personName,
  style,
  size = 20,
}: {
  targetType: ReportTarget;
  targetId: string;
  /** Who the report is about and who Block applies to. Leave out to only offer Report. */
  personId?: string;
  personName?: string;
  style?: StyleProp<ViewStyle>;
  size?: number;
}) {
  const store = useStore();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<'menu' | 'report' | null>(null);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (personId && personId === store.meId) return null;
  const first = personName?.split(' ')[0] ?? 'them';
  const isBlocked = personId ? store.isBlocked(personId) : false;
  const close = () => {
    setOpen(null);
    setReason(null);
    setDetails('');
    setError(undefined);
  };

  const send = async () => {
    if (!reason) return;
    setBusy(true);
    setError(undefined);
    const e = await store.report({ targetType, targetId, targetUserId: personId, reason, details: details.trim() || undefined });
    setBusy(false);
    if (e) {
      setError(`Couldn't send that. ${e}`);
      return;
    }
    close();
    toast(store.live ? 'Thanks for telling us. We review every report within 24 hours.' : 'Report sent (preview only, nothing was saved).');
  };

  const item = (icon: IconName, label: string, onPress: () => void, tone: 'text' | 'blushDeep' = 'text') => (
    <Pressable onPress={onPress} style={styles.item} accessibilityRole="button" accessibilityLabel={label}>
      <Icon name={icon} size={20} color={tone === 'blushDeep' ? 'blushDeep' : 'text'} />
      <Text variant="bodyStrong" color={tone}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <>
      <Pressable
        onPress={() => setOpen('menu')}
        hitSlop={10}
        style={[styles.trigger, style]}
        accessibilityRole="button"
        accessibilityLabel={`More options for this ${NOUN[targetType]}`}>
        <Icon name="ellipsis-horizontal" size={size} color="textSecondary" />
      </Pressable>

      <Modal visible={open !== null} transparent animationType="slide" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.sm }]}>
          {open === 'menu' ? (
            <View style={styles.inner}>
              {item('flag-outline', `Report this ${NOUN[targetType]}`, () => setOpen('report'))}
              {personId
                ? isBlocked
                  ? item('lock-open-outline', `Unblock ${first}`, () => {
                      store.setBlocked(personId, false);
                      close();
                      toast(`${first} is unblocked.`);
                    })
                  : item(
                      'ban-outline',
                      `Block ${first}`,
                      () => {
                        setOpen(null);
                        setConfirmBlock(true);
                      },
                      'blushDeep',
                    )
                : null}
              <Button kind="outline" label="Cancel" onPress={close} style={{ marginTop: Spacing.sm }} />
            </View>
          ) : open === 'report' ? (
            <ScrollView style={{ maxHeight: 620 }} contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
              <Text variant="title">Report this {NOUN[targetType]}</Text>
              <Text variant="small" color="textSecondary">
                Only the Zomi team sees reports. {personName ? `${first} won't know it was you.` : ''} We review every one within 24 hours.
              </Text>
              <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
                {REASONS.map((r) => {
                  const on = reason === r.reason;
                  return (
                    <Pressable
                      key={r.reason}
                      onPress={() => setReason(r.reason)}
                      style={[styles.reason, on && styles.reasonOn]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={r.label}>
                      <Icon name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? 'primary' : 'textMuted'} />
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyStrong">{r.label}</Text>
                        <Text variant="small" color="textSecondary">
                          {r.hint}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <Field
                label="Anything else we should know?"
                value={details}
                onChangeText={setDetails}
                placeholder="Optional"
                multiline
                maxLength={1000}
                style={{ minHeight: 72, paddingTop: 12, textAlignVertical: 'top' }}
              />
              {error ? (
                <Text variant="small" color="blushDeep">
                  {error}
                </Text>
              ) : null}
              <View style={styles.buttons}>
                <Button kind="outline" label="Cancel" onPress={close} style={{ flex: 1 }} />
                <Button label={busy ? 'Sending…' : 'Send report'} disabled={!reason || busy} onPress={send} style={{ flex: 1 }} />
              </View>
              {personId && !isBlocked ? (
                <Text
                  variant="smallStrong"
                  color="primary"
                  accessibilityRole="button"
                  onPress={() => {
                    setOpen(null);
                    setConfirmBlock(true);
                  }}>
                  Want to stop hearing from {first}? Block them too ›
                </Text>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      {personId ? (
        <ConfirmSheet
          open={confirmBlock}
          title={`Block ${first}?`}
          body={`${first} won't be able to message you or follow you, and you won't see their posts, classes or profile. Any follow between you is removed. They aren't told, and you can unblock them any time in Me → Privacy.`}
          confirmLabel="Block"
          cancelLabel="Cancel"
          destructive
          onConfirm={() => {
            store.setBlocked(personId, true);
            toast(`${first} is blocked.`);
          }}
          onClose={() => setConfirmBlock(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { padding: 4, borderRadius: Radius.pill },
  backdrop: { flex: 1, backgroundColor: 'rgba(28, 26, 34, 0.35)' },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: Radius.lg * 2, borderTopRightRadius: Radius.lg * 2, paddingTop: Spacing.xl },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
  },
  reasonOn: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  buttons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
});
