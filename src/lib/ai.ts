import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from './supabase';
import { StyleLabels, type Style } from './types';

export type DescribeInput = {
  title: string;
  style: Style;
  durationMin: number;
  studio?: string;
  /** Whatever the instructor already typed. Used as rough notes. */
  notes?: string;
};

export type DescribeResult = { description?: string; error?: string };

/**
 * Drafts a class description with AI. The real call goes through the
 * describe-class Edge Function, which holds the API key. In demo mode (no
 * account) it uses a simple built-in writer so demos still work.
 */
export async function describeClass(input: DescribeInput, opts: { demo: boolean }): Promise<DescribeResult> {
  if (opts.demo) return { description: demoDescription(input) };

  const { data, error } = await supabase.functions.invoke('describe-class', {
    body: { ...input, style: StyleLabels[input.style] },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json();
        if (body?.error) return { error: body.error };
      } catch {
        // fall through
      }
    }
    return { error: "Couldn't reach writing help. Check your connection and try again." };
  }
  return data?.description ? { description: data.description } : { error: 'Writing help came back empty. Try again?' };
}

/* ---------- Demo writer: no AI, just friendly templates ---------- */

const openers: Record<Style, string[]> = {
  pilates: ['Controlled, deep and a little shaky in the best way.', 'Slow burn, strong core, zero rushing.'],
  yoga: ['Breathe in, slow down, flow it out.', 'A flow that meets you where you are today.'],
  cycle: ['Lights down, music up, legs on fire.', 'Ride to the beat and leave it all on the bike.'],
  barre: ['Tiny moves, big shakes.', 'Pulses, pliés and a whole lot of shaking.'],
  strength: ['Lift heavy-ish, leave strong.', 'Real strength work with lots of form coaching.'],
  hiit: ['Short, sweaty and done before you know it.', 'Intervals that get your heart rate up fast.'],
  dance: ['Learn the choreo, feel like a star.', 'All the energy of a night out, none of the hangover.'],
};

let demoTurn = 0;

function demoDescription({ title, style, durationMin, notes }: DescribeInput) {
  const options = openers[style];
  const opener = options[demoTurn++ % options.length];
  const cleaned = notes?.trim().replace(/\s+/g, ' ').replace(/([^.!?])$/, '$1.');
  const extra = cleaned ? ` ${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}` : ' All levels welcome.';
  return `${opener} ${title} is ${durationMin} minutes of ${StyleLabels[style].toLowerCase()} that you'll feel tomorrow.${extra}`;
}
