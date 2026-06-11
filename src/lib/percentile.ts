import { Exam, PERCENTILE_ANCHORS } from "./examConfig";

/**
 * Estimate a percentile from a raw score via piecewise-linear interpolation
 * between the public cut-off anchors. This is an ESTIMATE, not official data —
 * always surface it as such in the UI.
 */
export function estimatePercentile(exam: Exam, score: number): number {
  const anchors = PERCENTILE_ANCHORS[exam];
  if (score <= anchors[0].score) return anchors[0].percentile;
  const last = anchors[anchors.length - 1];
  if (score >= last.score) return last.percentile;

  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (score >= a.score && score <= b.score) {
      const ratio = (score - a.score) / (b.score - a.score);
      const value = a.percentile + ratio * (b.percentile - a.percentile);
      return Math.round(value * 10) / 10;
    }
  }
  return last.percentile;
}

export const PERCENTILE_DISCLAIMER =
  "Estimated percentile, interpolated from publicly disclosed cut-off data. IIM does not publish official score-to-percentile tables, so treat this as a directional indicator, not an exact rank.";
