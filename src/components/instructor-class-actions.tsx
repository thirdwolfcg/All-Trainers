import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { dayLabel } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import type { ClassSession } from '@/lib/types';

import { ClassUpdateSheet } from './class-update-sheet';
import { ConfirmSheet } from './confirm-sheet';
import { SubSheet } from './sub-sheet';
import { Button } from './ui';

/** Need a sub, find a sub, never mind, cancel: for the instructor who owns the class. */
export function InstructorClassActions({ session, align = 'end' }: { session: ClassSession; align?: 'start' | 'end' }) {
  const store = useStore();
  const toast = useToast();
  const [findingSub, setFindingSub] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const bookedCount = store.bookersOf(session.id).length;
  const upcoming = new Date(session.startsAt).getTime() + session.durationMin * 60000 > Date.now();

  const followers = store.clients.length;
  const when = `${dayLabel(new Date(session.startsAt))}`;
  const justify = align === 'end' ? 'flex-end' : 'flex-start';

  if (session.status === 'cancelled') {
    return (
      <View style={[styles.row, { justifyContent: justify }]}>
        <Button
          size="sm"
          kind="ghost"
          icon="refresh"
          label="Bring it back"
          onPress={() => {
            store.setClassStatus(session.id, 'scheduled');
            toast(`${session.title} is back on the schedule.`);
          }}
        />
        <Button
          size="sm"
          kind="ghost"
          icon="trash-outline"
          label="Delete"
          accessibilityLabel={`Delete ${session.title}`}
          onPress={() => setConfirmDelete(true)}
        />
        <ConfirmSheet
          open={confirmDelete}
          title={`Delete ${session.title}?`}
          body="It comes off your schedule for good. Keeping it cancelled shows your followers it isn't happening."
          confirmLabel="Delete"
          destructive
          onConfirm={() => {
            store.deleteClass(session.id);
            toast('Class deleted.');
          }}
          onClose={() => setConfirmDelete(false)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.row, { justifyContent: justify }]}>
      {session.status === 'sub_needed' ? (
        <>
          <Button size="sm" kind="ghost" icon="people-outline" label="Find a sub" onPress={() => setFindingSub(true)} />
          <Button size="sm" kind="ghost" label="Never mind" onPress={() => setConfirmWithdraw(true)} />
        </>
      ) : session.status === 'scheduled' ? (
        <Button size="sm" kind="ghost" icon="swap-horizontal" label="Need a sub" onPress={() => setFindingSub(true)} />
      ) : null}
      {upcoming ? (
        <Button
          size="sm"
          kind="ghost"
          icon="megaphone-outline"
          label={bookedCount ? `Message booked (${bookedCount})` : 'Post an update'}
          accessibilityLabel={`Message everyone booked into ${session.title}`}
          onPress={() => setMessaging(true)}
        />
      ) : null}
      {upcoming ? (
        <Button
          size="sm"
          kind="ghost"
          icon="create-outline"
          label="Edit"
          accessibilityLabel={`Edit or delete ${session.title}`}
          onPress={() => router.push({ pathname: '/schedule/new', params: { edit: session.id } })}
        />
      ) : null}
      <Button size="sm" kind="ghost" icon="close" label="Cancel my class" onPress={() => setConfirmCancel(true)} />
      {messaging ? <ClassUpdateSheet session={session} open={messaging} onClose={() => setMessaging(false)} /> : null}

      {findingSub ? <SubSheet session={session} open={findingSub} onClose={() => setFindingSub(false)} /> : null}

      <ConfirmSheet
        open={confirmCancel}
        title={`Cancel ${session.title}?`}
        body={`It'll show as cancelled for ${when}, and your ${followers} followers will see it. You can bring it back any time.`}
        confirmLabel="Cancel class"
        destructive
        onConfirm={() => {
          store.setClassStatus(session.id, 'cancelled');
          toast(`${session.title} cancelled.`, { label: 'Undo', onPress: () => store.setClassStatus(session.id, 'scheduled') });
        }}
        onClose={() => setConfirmCancel(false)}
      />

      <ConfirmSheet
        open={confirmWithdraw}
        title="Stop looking for a sub?"
        body="Anyone you asked won't be able to say yes anymore, and the class goes back to normal."
        confirmLabel="Stop looking"
        cancelLabel="Keep looking"
        onConfirm={() => {
          store.withdrawSub(session.id);
          toast("Got it, you're teaching it.");
        }}
        onClose={() => setConfirmWithdraw(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.xs },
});
