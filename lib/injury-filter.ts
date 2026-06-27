export interface InjuryState {
  bodySectionId: string;
  severity: number; // 1-3
}

export interface MuscleEngagement {
  body_section_id: string;
  engagement_level: number; // 1-3
}

/**
 * Returns true if the exercise is safe given current injury states.
 * Excluded when ANY muscle engagement has severity + engagement_level > 4.
 */
export function isExerciseSafe(
  engagements: MuscleEngagement[],
  injuryStates: InjuryState[]
): boolean {
  if (injuryStates.length === 0) return true;

  const injuryMap = new Map<string, number>(
    injuryStates.map((s) => [s.bodySectionId, s.severity])
  );

  for (const engagement of engagements) {
    const severity = injuryMap.get(engagement.body_section_id);
    if (severity !== undefined && severity + engagement.engagement_level > 4) {
      return false;
    }
  }

  return true;
}
