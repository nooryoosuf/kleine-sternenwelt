export type StarState =
  | "hidden"
  | "sleeping"
  | "available"
  | "discovered"
  | "connected";

export type StarType =
  | "message"
  | "memory"
  | "question"
  | "secret"
  | "gift";

export interface StarUnlockCondition {
  /** date: unlocks on/after an ISO calendar date · interaction: custom trigger · manual: owner-gifted */
  type: "date" | "interaction" | "manual";
  value: string;
}

export interface Star {
  id: string;
  /** e.g. "STAR 07" — derived display label lives in the service, optional poetic title here */
  title?: string;
  message: string;
  /** ISO calendar date "YYYY-MM-DD" when a scheduled star wakes up */
  unlockDate: string;
  /** normalized sky coordinates 0..100 — deterministic, same place on every screen */
  position: { x: number; y: number };
  constellationId?: string;
  type: StarType;
  /**
   * Visual weight inside the constellation drawing. Small stars are details
   * (eyes, crumbs of moon); large stars are anchors (the guide-star).
   * Touch targets never shrink — only the artwork scales.
   */
  size?: "small" | "large";
  unlockCondition?: StarUnlockCondition;
  metadata?: Record<string, unknown>;
}

export interface Constellation {
  id: string;
  name: string;
  description?: string;
  starIds: string[];
  /** explicit pairs — controls exactly how the shape forms */
  connections: [string, string][];
  revealed: boolean;
  revealedAt?: string;
  /**
   * Story thread to the NEXT constellation — how they connect without lines.
   * Shown only after this one is complete, whispering where to look next.
   */
  after?: string;
  reward?: { type: string; id: string };
}

export interface StarSchedule {
  /** first day a star can unlock, ISO calendar date */
  startDate: string;
  /** days between unlocks */
  intervalDays: number;
  /** max backlog stars waiting at once — older ones queue behind. undefined = unlimited */
  maxCatchUpStars?: number;
  /**
   * Stars unlocking further than this many days ahead stay fully hidden.
   * Only the near future shimmers as sleeping dots — the sky keeps its shape secret.
   */
  visibleAheadDays?: number;
}

export interface StarPersist {
  /** starId -> ISO timestamp of discovery */
  discovered: Record<string, string>;
  revealedConstellations: string[];
  /** ISO calendar date of last sky visit (for the "busy while you were away" moment) */
  lastVisit: string | null;
  firstSeen: string | null;
  moonTaps: number;
  /** first-time walkthrough has been seen */
  introSeen?: boolean;
}
