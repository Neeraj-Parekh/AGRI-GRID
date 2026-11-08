// The 18 chapters in order, and the timeline built from the visible ones.
import { chProblem, chCorrode, chSense, chGuards, chInstall, chCycle, chLies } from './ch-field.js';
import { chMeet, chBuild, chCalib, chPrints, chNode } from './ch-bench.js';
import { chGrid, chSpace, chFarm, chSar, chSplit, chImpact } from './ch-grid.js';

export const CHAPTERS = [chProblem, chMeet, chBuild, chCorrode, chSense, chGuards, chInstall, chCycle, chGrid, chSpace, chCalib, chLies, chPrints, chNode, chFarm, chSar, chSplit, chImpact];

/**
 * Timeline over the visible chapters. hold: seconds to hold the last frame between chapters (record mode).
 * Returns { segs: [{ ch, i, t0, t1, dur }], total }.
 */
export function buildTimeline(hidden = [], hold = 0) {
  const segs = []; let t = 0;
  CHAPTERS.forEach((ch, i) => {
    if (hidden.includes(ch.n)) return;
    const len = ch.dur + hold;
    segs.push({ ch, i, t0: t, t1: t + len, dur: ch.dur });
    t += len;
  });
  return { segs, total: t };
}

/** Global time → { seg, local } (local clamped to the chapter duration, so holds freeze the last frame). */
export function locate(tl, T) {
  if (!tl.segs.length) return null;
  const Tc = Math.max(0, Math.min(tl.total - 1e-6, T));
  for (const s of tl.segs) if (Tc < s.t1) return { seg: s, local: Math.min(s.dur, Tc - s.t0) };
  const s = tl.segs[tl.segs.length - 1];
  return { seg: s, local: s.dur };
}
