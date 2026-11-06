import type { ClassSession, PostKind, Style } from '@/lib/types';

/**
 * Post prompts for instructors, timed around their classes.
 * For now these are written by us. The plan is for the AI to write them from
 * the instructor's own class, style, past posts and what their followers engage with
 * (see "Post ideas" in David's list).
 */
export type PostIdea = { id: string; kind: PostKind; prompt: string; titleHint: string; styles?: Style[] };
export type IdeaMoment = 'before' | 'after' | 'anytime';

const ideas: Record<IdeaMoment, PostIdea[]> = {
  before: [
    { id: 'b-drink', kind: 'recipe', prompt: 'What’s in your pre-class drink? Your people want to know.', titleHint: 'What I drink before I teach' },
    { id: 'b-stretch', kind: 'video', prompt: 'Got a quick stretch they can do before class? Share the routine.', titleHint: 'My 5-minute pre-class stretch' },
    {
      id: 'b-playlist',
      kind: 'playlist',
      prompt: 'Drop the playlist for today so they can get hyped on the way.',
      titleHint: 'Today’s class playlist',
      styles: ['cycle', 'dance', 'hiit', 'barre', 'strength'],
    },
    { id: 'b-expect', kind: 'note', prompt: 'Tell them what you have planned today. A little tease goes a long way.', titleHint: 'What we’re doing today' },
    { id: 'b-snack', kind: 'recipe', prompt: 'What do you eat before you teach? Share your go-to snack.', titleHint: 'My pre-class snack' },
  ],
  after: [
    { id: 'a-meal', kind: 'recipe', prompt: 'What’s your post-class meal? Share it while you’re eating it.', titleHint: 'Post-class fuel' },
    { id: 'a-cooldown', kind: 'video', prompt: 'Share the cooldown stretch so they can do it at home tonight.', titleHint: 'Cooldown you can do at home' },
    { id: 'a-shoutout', kind: 'note', prompt: 'Shout out the crew that just showed up. They love that.', titleHint: 'That class though' },
    {
      id: 'a-replay',
      kind: 'playlist',
      prompt: 'Post today’s playlist so they can replay it all week.',
      titleHint: 'Today’s playlist, on repeat',
      styles: ['cycle', 'dance', 'hiit', 'barre', 'strength'],
    },
  ],
  anytime: [
    { id: 'n-recovery', kind: 'note', prompt: 'What does your rest day look like? People love the real routine.', titleHint: 'My rest day routine' },
    { id: 'n-form', kind: 'video', prompt: 'Share a 60-second form tip for the move everyone gets wrong.', titleHint: 'Form check' },
    { id: 'n-listening', kind: 'playlist', prompt: 'What are you listening to this week? Share the playlist.', titleHint: 'On repeat this week' },
    { id: 'n-breakfast', kind: 'recipe', prompt: 'What’s your go-to breakfast on a teaching day?', titleHint: 'Teaching day breakfast' },
  ],
};

const HOUR = 3600000;

/** Where the instructor is in their day: a class coming up in the next 6 hours, one that ended in the last 4, or neither. */
export function ideaMoment(myClasses: ClassSession[], now = new Date()): { moment: IdeaMoment; cls?: ClassSession } {
  const t = now.getTime();
  const upcoming = myClasses
    .filter((c) => c.status !== 'cancelled' && new Date(c.startsAt).getTime() > t && new Date(c.startsAt).getTime() - t <= 6 * HOUR)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  if (upcoming) return { moment: 'before', cls: upcoming };
  const justDone = myClasses
    .filter((c) => {
      const end = new Date(c.startsAt).getTime() + c.durationMin * 60000;
      return c.status !== 'cancelled' && end <= t && t - end <= 4 * HOUR;
    })
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))[0];
  if (justDone) return { moment: 'after', cls: justDone };
  return { moment: 'anytime' };
}

export function ideasFor(moment: IdeaMoment, style?: Style): PostIdea[] {
  return ideas[moment].filter((i) => !i.styles || !style || i.styles.includes(style));
}

export function findIdea(id: string | undefined): PostIdea | undefined {
  if (!id) return undefined;
  return [...ideas.before, ...ideas.after, ...ideas.anytime].find((i) => i.id === id);
}
