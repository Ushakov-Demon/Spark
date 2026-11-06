/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { cite, sv } from '../../components/sourced.js';
import { NUMBER_LOCALE, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t as tl } from '../../knowledge/messages.js';
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

/** The body on the thread, kg, unless another is taken (an example: the mass does not enter the period). */
export const BODY_MASS = 0.03;
/** The second thread's share of the first: 30 cm to 50 cm. */
export const SHORT_THREAD = 0.6;
/** The circle on the sheet, m (radius), and the thread from the hand to the body. */
export const CIRCLE_RADIUS: SourcedValue = sv(0.15, 'm', 'the circle on the sheet', 'single-source', 0.01, [cite('ua-textbook-2024-bariakhtar-physics-7', 'Лабораторна робота № 2: аркуш із зображенням кола радіусом 15 см', '—', 0.15)]);

/** The circle's widest radius, as a share of the shorter thread: past it the thread all but lies flat, and no hand keeps that up. */
export const WIDEST_CIRCLE = 0.8;

/** The pendulum's length, m: not shorter than its ball allows; up to the longest ever hung (Foucault's was 67 m). */
export const PENDULUM_SHORTEST = 0.05;
export const PENDULUM_LONGEST = 100;

/** The pendulum's swing, m: pulled aside this far by default (on a metre's thread); never past this share of the thread, where small swings end. */
export const SWING = { narrow: 0.025, wide: 0.055, widest: 0.4 } as const;
/** The short thread's share of the long one. */
export const SHORT_PENDULUM = 0.25;
/** A length on the pendulum, to half a centimetre under 2 m (an amplitude of 2,5 cm), to the centimetre in metres from there. */
export function pendulumLength(m: number, l: Locale): string {
  const n = (x: number, digits: number) => new Intl.NumberFormat(NUMBER_LOCALE[l], { maximumFractionDigits: digits, useGrouping: false }).format(x);
  return m < 2 ? `${n(Math.round(m * 200) / 2, 1)} ${tl(l, 'unit-sym-cm')}` : `${n(m, 2)} ${tl(l, 'unit-sym-m')}`;
}
