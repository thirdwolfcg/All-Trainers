/**
 * The line under "Hiii {name}" on My Week. It rotates each time the screen opens
 * and always uses the instructor's real numbers for the next 7 days.
 */
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function weekLine({ classes, studios, studioName }: { classes: number; studios: number; studioName?: string }, seed: number): string {
  const pick = (lines: string[]) => lines[Math.floor(seed * lines.length) % lines.length];
  const c = plural(classes, 'class', 'classes');
  const s = plural(studios, 'studio', 'studios');

  if (classes === 0) {
    return pick([
      'Empty week, full potential.',
      'Clean slate. Add a class and your people see it right away.',
      'Room for something new. Add a class and let your crew find you.',
      'Quiet week? Add a class and fill those spots.',
      'Nothing on the calendar yet. Your people are waiting.',
    ]);
  }

  // One class at one studio: nudge them to make it count with their people.
  if (classes === 1) {
    return pick([
      'One class, all your people. Post a hype before class and watch them show up.',
      'Small week, big energy. Drop the playlist so your crew can get ready.',
      'One class this week. Make it the one they talk about. Send your crew a note.',
      'Just one class, so make it personal. Say hi to your regulars before you start.',
    ]);
  }

  if (studios === 1) {
    return pick([
      `${c}${studioName ? ` at ${studioName}` : ''}, one schedule. You’re booked and busy.`,
      `${c} this week, all in one place.`,
      `You’re busy this week. ${c}${studioName ? ` at ${studioName}` : ''}, one you.`,
    ]);
  }

  return pick([
    `${c}, ${s}, one schedule. You’re booked and busy.`,
    `${c} across ${s}, all in one place.`,
    'Teaching all over town? Your whole week lives right here.',
    `You’re everywhere this week. ${c}, ${s}, one you.`,
  ]);
}
