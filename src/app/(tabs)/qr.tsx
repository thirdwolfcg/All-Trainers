import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { QrCode } from '@/components/qr-code';
import { Screen } from '@/components/screen';
import { Avatar, Button, EmptyState, Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { shareInvite } from '@/lib/invite';
import { followUrl } from '@/lib/links';
import { markSetup } from '@/lib/setup';
import { useStore } from '@/lib/store';

/** The instructor's QR code. Clients point their phone camera at it to follow. */
export default function MyQr() {
  const store = useStore();
  useEffect(() => {
    markSetup(store.meId, 'openedQr');
  }, [store.meId]);
  const me = store.instructor(store.meId);

  if (!me || store.role !== 'instructor') {
    return (
      <Screen back title="My QR code">
        <EmptyState icon="qr-code-outline" title="For instructors" body="Instructors get a QR code clients can scan to follow them." />
      </Screen>
    );
  }

  const url = followUrl(me.handle);

  return (
    <>
      <Screen back title="My QR code">
        <View style={styles.card}>
          <Avatar name={me.name} size={56} />
          <Text variant="title" align="center">
            {me.name}
          </Text>
          <Text variant="eyebrow" color="textSecondary">
            Scan to follow me
          </Text>
          <View style={styles.qr}>
            <QrCode value={url} size={232} />
          </View>
          <Text variant="quote" color="textSecondary" align="center" style={styles.aside}>
            Point a phone camera here. No app needed to see my schedule.
          </Text>
        </View>

        <Button
          icon="share-outline"
          label="Share my link"
          onPress={() => shareInvite(`Follow me on Zomi to see where I'm teaching this week: ${url}`)}
          style={{ marginTop: Spacing.xl }}
        />

        <View style={styles.tips}>
          <Text variant="quote" color="textSecondary" style={styles.aside}>
            Where to put it
          </Text>
          <Text variant="quote" color="textSecondary" style={styles.aside}>
            Screenshot it for your IG story, ask the front desk to print it, or flash it on your phone at the end of class.
          </Text>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  // Faded, background-feel helper text: serif italic, smaller, see-through.
  aside: { fontSize: 15, lineHeight: 22, opacity: 0.55 },
  card: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qr: { padding: Spacing.sm, backgroundColor: '#FFFFFF', borderRadius: Radius.md, marginVertical: Spacing.sm },
  tips: { gap: Spacing.sm, marginTop: Spacing.xl },
});
