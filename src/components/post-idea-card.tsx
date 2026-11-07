import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Icon, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { timeLabel } from '@/lib/dates';
import { ideaMoment, ideasFor } from '@/lib/post-ideas';
import { useStore } from '@/lib/store';
import { styleLabel, type ClassSession } from '@/lib/types';

/** A nudge on My Week with something to post, timed around the instructor's classes. "Not today" hides it until tomorrow. */
export function PostIdeaCard({ myClasses }: { myClasses: ClassSession[] }) {
  const store = useStore();
  const dayKey = `post-idea-${new Date().toDateString()}`;
  const { moment, cls } = useMemo(() => ideaMoment(myClasses), [myClasses]);
  const options = useMemo(() => ideasFor(moment, cls?.style), [moment, cls?.style]);
  const [i, setI] = useState(() => new Date().getDate() % options.length);
  if (store.dismissedTips.has(dayKey) || !options.length) return null;
  const idea = options[i % options.length];

  const context = cls
    ? moment === 'before'
      ? `Your ${styleLabel(cls.style)} class is at ${timeLabel(new Date(cls.startsAt))}`
      : `Nice ${styleLabel(cls.style)} class`
    : 'For today';

  return (
    <Card tone="gray" style={styles.card}>
      <View style={styles.top}>
        <Icon name="sparkles-outline" size={16} color="primary" />
        <Text variant="eyebrow" color="primary" style={{ flex: 1 }}>
          Post idea · {context}
        </Text>
        <Pressable
          onPress={() => store.dismissTip(dayKey)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Not today, hide post ideas until tomorrow">
          <Icon name="close" size={18} color="textSecondary" />
        </Pressable>
      </View>
      <Text variant="heading">{idea.prompt}</Text>
      <View style={styles.row}>
        <Button size="sm" icon="create-outline" label="Post this" onPress={() => router.push({ pathname: '/post/new', params: { idea: idea.id } })} />
        {options.length > 1 ? <Button size="sm" kind="ghost" label="Another idea" onPress={() => setI(i + 1)} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md, marginBottom: Spacing.xl },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
});
