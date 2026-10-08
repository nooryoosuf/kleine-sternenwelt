import type { Constellation, Star } from "@/types/stars";

export interface ConstellationProgress {
  constellation: Constellation;
  discoveredCount: number;
  total: number;
  complete: boolean;
  /** pairs where both ends are discovered — these lines are drawn */
  litConnections: [string, string][];
}

/** Pure derivation: which lines glow, which constellations are complete. */
export function constellationProgress(
  constellations: Constellation[],
  discovered: Record<string, string>
): ConstellationProgress[] {
  return constellations.map((c) => {
    const discoveredCount = c.starIds.filter((id) => discovered[id]).length;
    const litConnections = c.connections.filter(([a, b]) => discovered[a] && discovered[b]) as [string, string][];
    return {
      constellation: c,
      discoveredCount,
      total: c.starIds.length,
      complete: discoveredCount === c.starIds.length,
      litConnections,
    };
  });
}

/**
 * After a discovery, returns constellations that just became complete
 * (complete now, but not in alreadyRevealed). Pure — the store persists the result.
 */
export function newlyCompleted(
  constellations: Constellation[],
  discovered: Record<string, string>,
  alreadyRevealed: string[]
): Constellation[] {
  return constellations.filter(
    (c) =>
      !alreadyRevealed.includes(c.id) &&
      c.starIds.length > 0 &&
      c.starIds.every((id) => discovered[id])
  );
}

/**
 * Static validation for constellation content — powers the shape-lab and
 * catches broken drawings (dangling lines, overlapping tap targets) early.
 * Pure: feed it the same data files the sky uses.
 */
export function validateSky(stars: Star[], constellations: Constellation[]): string[] {
  const issues: string[] = [];
  const byId = new Map(stars.map((s) => [s.id, s]));
  const seen = new Set<string>();
  for (const s of stars) {
    if (seen.has(s.id)) issues.push(`duplicate star id: ${s.id}`);
    seen.add(s.id);
    if (s.position.x < 0 || s.position.x > 100 || s.position.y < 0 || s.position.y > 100) {
      issues.push(`${s.id}: position outside 0–100 space`);
    }
  }
  for (const c of constellations) {
    for (const id of c.starIds) {
      if (!byId.has(id)) issues.push(`${c.id}: member ${id} does not exist`);
    }
    for (const [a, b] of c.connections) {
      if (!byId.has(a) || !byId.has(b)) issues.push(`${c.id}: line ${a}–${b} dangles off known stars`);
      if (!c.starIds.includes(a) || !c.starIds.includes(b)) issues.push(`${c.id}: line ${a}–${b} reaches outside its members`);
      if (a === b) issues.push(`${c.id}: line ${a}–${b} connects a star to itself`);
    }
    // tap-target overlap: 48px targets closer than ~5 units will fight on phones
    const pts = c.starIds.map((id) => byId.get(id)).filter((s): s is Star => !!s);
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].position.x - pts[j].position.x;
        const dy = pts[i].position.y - pts[j].position.y;
        if (Math.hypot(dx, dy) < 5) issues.push(`${c.id}: ${pts[i].id} ↔ ${pts[j].id} closer than 5 units — taps may overlap`);
      }
    }
  }
  return issues;
}
