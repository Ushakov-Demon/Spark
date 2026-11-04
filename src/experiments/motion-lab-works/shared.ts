/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { cite, sv } from '../../components/sourced.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';

/** From the chalk mark to the metal cylinder that stops the ball, m (the path), and half of it. */
export const ROLL_PATH = 1.0;
export const THREAD_LENGTH: SourcedValue = sv(0.5, 'm', 'the thread from the hand to the body', 'single-source', 0.2, [cite('ua-textbook-2024-bariakhtar-physics-7', 'Лабораторна робота № 2: нитка завдовжки 50–60 см (з петлею)', '—', 0.5)]);
/** The pendulum's balls, kg: «two small heavy balls of different masses» — the masses are an estimate (the period does not depend on them). */
export const PENDULUM_BALLS = { light: 0.03, heavy: 0.1 } as const;

/** What stands on the table for each of the motion benches. */
export const MOTION_SETUP: Record<'incline' | 'circle' | 'pendulum', LocalizedText> = {
  incline: msg('motion-lab-works-setup-incline'),
  circle: msg('motion-lab-works-setup-circle'),
  pendulum: msg('motion-lab-works-setup-pendulum'),
};
