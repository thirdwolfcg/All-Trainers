import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { dayLabel, timeLabel } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import type { ClassSession } from '@/lib/types';

import { Button, Chip, Text } from './ui';

const QUICK = [
  'Running about 5 minutes late, hang tight!',
  'Heads up, the studio heat is out. Bring a layer.',
  'Bring a mat and a water bottle today.',
  'New playlist today, get ready to sing.',
];

/** Instructor writes one update for everyone booked into a class. */
export function ClassUpdateSheet({ session, open, onClose }: { session: ClassSession; open: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const toast = useToast();
  const [body, setBody] = useState('');
  const count = store.bookersOf(session.id).length;
  const start = new Date(session.startsAt);

  const send = () => {
    const n = store.postClassUpdate(session.id, body);
    setBody('');
    onClose();
    toast(n ? `Sent to ${n} ${n === 1 ? 'person' : 'people'} booked into ${session.title}.` : `Posted on ${session.title}.`);
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.sm }]}>
        <View style={styles.inner}>
          <View style={styles.handle} />
          <Text variant="eyebrow" color="textSecondary">
            {dayLabel(start)} · {timeLabel(start)}
          </Text>
          <Text variant="title">Message everyone booked</Text>
          <Text variant="small" color="textSecondary" style={{ marginBottom: Spacing.md }}>
            {count
              ? `Goes to the ${count} ${count === 1 ? 'person' : 'people'} booked into ${session.title} on All Trainers, and shows on the class.`
              : `No one has marked this class booked on All Trainers yet. Your update still shows on the class page.`}
          </Text>
          <View style={styles.quick}>
            {QUICK.map((q) => (
              <Chip key={q} label={q} onPress={() => setBody(q)} />
            ))}
          </View>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Running late? Heat's out? Bring a mat?"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
            style={styles.input}
            accessibilityLabel="Update for everyone booked"
          />
          <Button label="Send update" icon="megaphone-outline" disabled={!body.trim()} onPress={send} style={{ marginTop: Spacing.md }} />
          <Text variant="small" color="textSecondary" style={{ marginTop: Spacing.sm }}>
            People who booked through ClassPass or the studio but never tapped “Booked it” won’t get it.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(28,26,34,0.35)' },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.xl, paddingTop: Spacing.md },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: Spacing.lg },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.text,
    textAlignVertical: 'top',
  },
});
