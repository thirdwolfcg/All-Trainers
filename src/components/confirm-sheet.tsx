import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

import { Button, Text } from './ui';

/** A "are you sure?" sheet for actions that affect other people. Works the same on phones and the web. */
export function ConfirmSheet({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Keep it',
  destructive = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.sm }]}>
        <View style={styles.inner}>
          <Text variant="title">{title}</Text>
          <Text variant="body" color="textSecondary">
            {body}
          </Text>
          <View style={styles.buttons}>
            <Button kind="outline" label={cancelLabel} onPress={onClose} style={{ flex: 1 }} />
            <Button
              kind={destructive ? 'ink' : 'primary'}
              label={confirmLabel}
              onPress={() => {
                onClose();
                onConfirm();
              }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(28, 26, 34, 0.35)' },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.lg * 2,
    borderTopRightRadius: Radius.lg * 2,
    paddingTop: Spacing.xl,
  },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  buttons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
});
