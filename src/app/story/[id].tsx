import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmSheet } from '@/components/confirm-sheet';
import { SafetyMenu } from '@/components/safety-menu';
import { STORY_COLORS } from '@/components/stories';
import { Avatar, Icon, Text } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { relativeTime, timeLabel, dayLabel } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { useToast } from '@/lib/toast';

const SECONDS = 5;

/**
 * Full-screen stories for one instructor, then the next in `queue`. Tap the
 * right side for the next story, the left for the one before, hold to pause.
 */
export default function StoryViewer() {
  const { id, queue: queueParam } = useLocalSearchParams<{ id: string; queue?: string }>();
  const store = useStore();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const queue = (queueParam ?? id).split(',').filter(Boolean);
  const [who, setWho] = useState(id);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const instructor = store.instructor(who);
  // Freeze this person's stories while watching, so marking one seen doesn't reorder them.
  const [list, setList] = useState(() => store.storiesOf(who));
  useEffect(() => {
    setList(store.storiesOf(who));
    setI(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [who]);

  const story = list[i];
  const isMine = story?.instructorId === store.meId;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const nextPerson = () => {
    const at = queue.indexOf(who);
    const nextId = queue.slice(at + 1).find((q) => store.storiesOf(q).length > 0);
    if (nextId) setWho(nextId);
    else close();
  };
  const next = () => (i < list.length - 1 ? setI(i + 1) : nextPerson());
  const prev = () => {
    if (i > 0) return setI(i - 1);
    const at = queue.indexOf(who);
    const before = queue
      .slice(0, Math.max(0, at))
      .reverse()
      .find((q) => store.storiesOf(q).length > 0);
    if (before) setWho(before);
    else progress.setValue(0);
  };

  // Mark seen and run the progress bar.
  useEffect(() => {
    if (!story) return;
    store.markStorySeen(story.id);
    progress.setValue(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  useEffect(() => {
    if (!story || paused || confirmDelete) return;
    const current = (progress as unknown as { _value: number })._value ?? 0;
    const anim = Animated.timing(progress, { toValue: 1, duration: SECONDS * 1000 * (1 - current), easing: Easing.linear, useNativeDriver: false });
    anim.start(({ finished }) => finished && next());
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, paused, confirmDelete]);

  if (!instructor || !story) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <Text variant="heading" color="onPrimary">
          This story has ended.
        </Text>
        <Pressable onPress={close} style={{ marginTop: Spacing.lg }} accessibilityRole="button">
          <Text variant="bodyStrong" color="onPrimary">
            Close
          </Text>
        </Pressable>
      </View>
    );
  }

  const colors = STORY_COLORS[story.background];
  const cls = story.classId ? store.classes.find((c) => c.id === story.classId) : undefined;
  const studio = cls ? store.studio(cls.studioId) : undefined;

  return (
    <View style={[styles.root, { backgroundColor: story.imageUrl ? '#000' : colors.bg }]}>
      <View style={[styles.frame, { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.md }]}>
        {/* Progress bars */}
        <View style={styles.bars} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {list.map((s, n) => (
            <View key={s.id} style={styles.bar}>
              {n < i ? <View style={[styles.fill, { width: '100%' }]} /> : null}
              {n === i ? <Animated.View style={[styles.fill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} /> : null}
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.head}>
          <Pressable
            style={styles.who}
            onPress={() => {
              close();
              if (!isMine) router.push({ pathname: '/instructor/[id]', params: { id: instructor.id } });
            }}
            accessibilityRole="link"
            accessibilityLabel={`${instructor.name}, posted ${relativeTime(story.createdAt)}`}>
            <Avatar name={instructor.name} size={32} />
            <Text variant="smallStrong" color={story.imageUrl ? 'onPrimary' : undefined} style={!story.imageUrl && { color: colors.fg }}>
              {isMine ? 'Your story' : instructor.name}
            </Text>
            <Text variant="small" style={{ color: story.imageUrl ? 'rgba(255,255,255,0.8)' : colors.fg, opacity: 0.8 }}>
              {relativeTime(story.createdAt)}
            </Text>
          </Pressable>
          {isMine ? (
            <Pressable onPress={() => setConfirmDelete(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Delete this story">
              <Icon name="trash-outline" size={20} color={story.imageUrl || colors.fg === '#FFFFFF' ? 'onPrimary' : 'text'} />
            </Pressable>
          ) : (
            <View style={styles.menuWrap}>
              <SafetyMenu targetType="story" targetId={story.id} personId={instructor.id} personName={instructor.name} />
            </View>
          )}
          <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close stories">
            <Icon name="close" size={26} color={story.imageUrl || colors.fg === '#FFFFFF' ? 'onPrimary' : 'text'} />
          </Pressable>
        </View>

        {/* The story */}
        <View style={styles.body}>
          {story.imageUrl ? (
            <Image
              source={{ uri: story.imageUrl }}
              style={styles.photo}
              resizeMode="contain"
              accessibilityLabel={story.text ? `Photo: ${story.text}` : 'Story photo'}
            />
          ) : null}
          {story.text ? (
            <Text
              variant={story.imageUrl ? 'heading' : 'display'}
              align="center"
              style={[story.imageUrl ? styles.caption : { color: colors.fg, paddingHorizontal: Spacing.xl }]}
              accessibilityRole="text">
              {story.text}
            </Text>
          ) : null}

          {/* Taps: left half back, right half forward, hold to pause */}
          <View style={StyleSheet.absoluteFill} accessibilityElementsHidden={false}>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <Pressable
                style={{ flex: 1 }}
                onPress={prev}
                onLongPress={() => setPaused(true)}
                onPressOut={() => setPaused(false)}
                accessibilityRole="button"
                accessibilityLabel="Previous story"
              />
              <Pressable
                style={{ flex: 2 }}
                onPress={next}
                onLongPress={() => setPaused(true)}
                onPressOut={() => setPaused(false)}
                accessibilityRole="button"
                accessibilityLabel="Next story"
              />
            </View>
          </View>
        </View>

        {/* Class sticker */}
        {cls ? (
          <Pressable
            style={styles.sticker}
            onPress={() => {
              close();
              router.push({ pathname: '/class/[id]', params: { id: cls.id } });
            }}
            accessibilityRole="link"
            accessibilityLabel={`See class ${cls.title}`}>
            <Icon name="calendar-outline" size={18} color="primary" />
            <View style={{ flex: 1 }}>
              <Text variant="smallStrong" numberOfLines={1}>
                {cls.title}
              </Text>
              <Text variant="small" color="textSecondary" numberOfLines={1}>
                {dayLabel(new Date(cls.startsAt))} · {timeLabel(new Date(cls.startsAt))}
                {studio ? ` · ${studio.name}` : ''}
              </Text>
            </View>
            <Text variant="smallStrong" color="primary">
              See class ›
            </Text>
          </Pressable>
        ) : null}

        {isMine ? (
          <Text variant="small" align="center" style={{ color: story.imageUrl || colors.fg === '#FFFFFF' ? '#FFFFFF' : colors.fg, marginTop: Spacing.md }}>
            {store.storyViews(story.id) ? `Seen by ${store.storyViews(story.id)}` : 'No views yet'}
          </Text>
        ) : null}
      </View>

      <ConfirmSheet
        open={confirmDelete}
        title="Delete this story?"
        body="It disappears for everyone right away."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          store.deleteStory(story.id);
          toast('Story deleted.');
          if (list.length <= 1) close();
          else {
            setList(list.filter((s) => s.id !== story.id));
            setI(Math.min(i, list.length - 2));
          }
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1C1A22' },
  frame: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: Spacing.md },
  bars: { flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  fill: { height: 3, backgroundColor: '#FFFFFF' },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, zIndex: 2 },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  menuWrap: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 999 },
  body: { flex: 1, justifyContent: 'center' },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: Radius.lg },
  caption: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.xl,
    color: '#FFFFFF',
    backgroundColor: 'rgba(28,26,34,0.55)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  sticker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
});
