import type { Star, StarSchedule, StarState } from "@/types/stars";

/** Local calendar date "YYYY-MM-DD" — the whole schedule runs on calendar days, never timers. */
export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function cmpDate(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** ISO calendar date plus N days (local calendar, no timers). */
function addDaysStr(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return todayStr(dt);
}

/** "STAR 07" style label from schedule order (secret stars get "✦"). */
export function starLabel(star: Star, scheduled: Star[]): string {
  const i = scheduled.findIndex((s) => s.id === star.id);
  if (i < 0) return "✦";
  return `STAR ${String(i + 1).padStart(2, "0")}`;
}

export interface ResolvedStar {
  star: Star;
  state: StarState;
  label: string;
  discoveredAt?: string;
}

/**
 * Core scheduling rule. Pure function — same inputs, same sky. No side effects,
 * so refreshes and midnight crossings can never double-unlock.
 *
 * - discovered  -> "discovered" (connected-ness is layered on by constellation-service)
 * - secret with unmet interaction condition -> "hidden"
 * - unlockDate further than visibleAheadDays out -> "hidden" (the shape stays secret)
 * - unlockDate > today, but near -> "sleeping"
 * - released but beyond the maxCatchUp backlog window -> "sleeping" (queued)
 * - otherwise -> "available"
 */
export function resolveStars(
  scheduled: Star[],
  secrets: Star[],
  discovered: Record<string, string>,
  secretUnlocked: boolean,
  today: string,
  schedule: StarSchedule
): ResolvedStar[] {
  const released = scheduled
    .filter((s) => cmpDate(s.unlockDate, today) <= 0)
    .sort((a, b) => cmpDate(a.unlockDate, b.unlockDate) || (a.id < b.id ? -1 : 1));

  const backlog = released.filter((s) => !discovered[s.id]);
  const cap = schedule.maxCatchUpStars;
  const waitingIds =
    cap === undefined ? new Set(backlog.map((s) => s.id)) : new Set(backlog.slice(0, Math.max(0, cap)).map((s) => s.id));

  const horizon = addDaysStr(today, schedule.visibleAheadDays ?? 2);

  const out: ResolvedStar[] = [];
  for (const s of scheduled) {
    const label = starLabel(s, scheduled);
    const at = discovered[s.id];
    if (at) {
      out.push({ star: s, state: "discovered", label, discoveredAt: at });
    } else if (cmpDate(s.unlockDate, horizon) > 0) {
      out.push({ star: s, state: "hidden", label });
    } else if (cmpDate(s.unlockDate, today) > 0) {
      out.push({ star: s, state: "sleeping", label });
    } else if (!waitingIds.has(s.id)) {
      out.push({ star: s, state: "sleeping", label });
    } else {
      out.push({ star: s, state: "available", label });
    }
  }
  for (const s of secrets) {
    const at = discovered[s.id];
    if (at) out.push({ star: s, state: "discovered", label: "✦", discoveredAt: at });
    else if (secretUnlocked) out.push({ star: s, state: "available", label: "✦" });
    else out.push({ star: s, state: "hidden", label: "✦" });
  }
  return out;
}

/** Stars the user can discover right now. */
export function availableStars(resolved: ResolvedStar[]): ResolvedStar[] {
  return resolved.filter((r) => r.state === "available");
}
