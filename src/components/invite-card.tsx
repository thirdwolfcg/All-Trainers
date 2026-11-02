import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { shareInvite, textInvite } from '@/lib/invite';

import { Button, Icon, Text, type IconName } from './ui';

/** A small panel with a pitch and two ways to send an invite: text or share sheet. */
export function InviteCard({
  eyebrow,
  title,
  body,
  message,
  icon = 'paper-plane-outline',
  textLabel = 'Text someone',
  style,
}: {
  eyebrow: string;
  title?: string;
  body: string;
  message: string;
  icon?: IconName;
  textLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.inline}>
        <Icon name={icon} size={16} color="primary" />
        <Text variant="eyebrow" color="primary">
          {eyebrow}
        </Text>
      </View>
      {title ? <Text variant="heading">{title}</Text> : null}
      <Text variant="small" color="textSecondary">
        {body}
      </Text>
      <View style={styles.buttons}>
        <Button size="sm" kind="ink" icon="chatbubble-outline" label={textLabel} onPress={() => textInvite(message)} />
        <Button size="sm" kind="outline" icon="share-outline" label="Share another way" onPress={() => shareInvite(message)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm, padding: Spacing.lg, borderRadius: Radius.lg, backgroundColor: Colors.surface },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 4 },
});
