import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { timeLabel } from '@/lib/dates';
import type { BookingLink, BookingPlatform, ClassSession, Instructor, Studio } from '@/lib/types';

import { Icon, Text, type IconName } from './ui';

const platformInfo: Record<BookingPlatform, { name: string; icon: IconName; blurb: string }> = {
  studio: { name: 'Studio app or site', icon: 'storefront-outline', blurb: "Book direct. Studios love you for it." },
  mindbody: { name: 'Mindbody', icon: 'calendar-outline', blurb: 'Use your Mindbody account and class packs.' },
  classpass: { name: 'ClassPass', icon: 'ticket-outline', blurb: 'Spend your ClassPass credits.' },
  other: { name: 'Booking page', icon: 'open-outline', blurb: 'Opens the booking page.' },
};

/** Studio direct first, then the class's own link, then the booking apps. */
export function bookingOptions(session: ClassSession, studio: Studio): (BookingLink & { exact?: boolean })[] {
  const order: BookingPlatform[] = ['studio', 'mindbody', 'classpass', 'other'];
  const links = [...studio.bookingLinks].sort((a, b) => order.indexOf(a.platform) - order.indexOf(b.platform));
  return session.bookingUrl ? [{ platform: 'other', url: session.bookingUrl, label: 'This exact class', exact: true }, ...links] : links;
}

export function BookingSheet({
  open,
  onClose,
  session,
  instructor,
  studio,
  onOpened,
}: {
  open: boolean;
  onClose: () => void;
  /** Called after a booking link opens, so the app can ask "did you book it?" */
  onOpened?: () => void;
  session: ClassSession;
  instructor: Instructor;
  studio: Studio;
}) {
  const insets = useSafeAreaInsets();
  const options = bookingOptions(session, studio);
  const start = new Date(session.startsAt);

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.sm }]}>
        <View style={styles.inner}>
          <View style={styles.handle} />
          <Text variant="eyebrow" color="textSecondary">
            Where do you wanna book?
          </Text>
          <Text variant="title" style={{ marginTop: 4 }}>
            {session.title}
          </Text>
          <Text variant="small" color="textSecondary" style={{ marginBottom: Spacing.md }}>
            {timeLabel(start)} with {instructor.name.split(' ')[0]} at {studio.name}
          </Text>

          {options.length === 0 ? (
            <Text variant="body" color="textSecondary" style={{ paddingVertical: Spacing.lg }}>
              No booking links for {studio.name} yet. Slide into {instructor.name.split(' ')[0]}&apos;s DMs and ask how to grab a spot.
            </Text>
          ) : (
            options.map((o) => {
              const info = platformInfo[o.platform];
              return (
                <Pressable
                  key={`${o.platform}-${o.url}`}
                  onPress={() => {
                    onClose();
                    Linking.openURL(o.url);
                    onOpened?.();
                  }}
                  accessibilityRole="link"
                  style={({ pressed }) => [styles.option, pressed && { backgroundColor: Colors.surface }]}>
                  <View style={styles.optionIcon}>
                    <Icon name={o.exact ? 'flash-outline' : info.icon} size={18} color="primary" />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong">{o.label ?? info.name}</Text>
                    <Text variant="small" color="textSecondary">
                      {o.exact ? 'Straight to this class, fastest way in.' : info.blurb}
                    </Text>
                  </View>
                  <Icon name="arrow-forward" size={18} color="textSecondary" />
                </Pressable>
              );
            })
          )}

          <Text variant="small" color="textSecondary" style={{ marginTop: Spacing.md }}>
            Booking, payment and late cancel fees are handled by where you book, not by Zomi.
          </Text>
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: -Spacing.sm,
    borderRadius: Radius.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
