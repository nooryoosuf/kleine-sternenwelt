import type { Constellation, Star, StarSchedule } from "@/types/stars";

/**
 * The daily rhythm. Tweak these three values — everything else derives from them.
 * startDate is a calendar date (not a 24h timer): star N unlocks on
 * startDate + N * intervalDays. Missed days accumulate as a backlog.
 */
export const STAR_SCHEDULE: StarSchedule = {
  startDate: "2026-10-01",
  intervalDays: 1,
  maxCatchUpStars: 8,
  /** future stars beyond this many days stay fully hidden — the sky keeps its secrets */
  visibleAheadDays: 2,
};

/** day offset from STAR_SCHEDULE.startDate */
function at(offset: number): string {
  const [y, m, d] = STAR_SCHEDULE.startDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + offset * STAR_SCHEDULE.intervalDays);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

interface Seed {
  id: string;
  offset: number;
  title: string;
  message: string;
  x: number;
  y: number;
  constellationId: string;
}

interface Seed {
  id: string;
  offset: number;
  title: string;
  message: string;
  x: number;
  y: number;
  constellationId: string;
  /**
   * Visual weight inside the drawing. Small stars are details
   * (eyes, nose, moon-crumbs); large stars are anchors (the guide-star).
   * The touch target stays the same — only the artwork scales.
   */
  size?: "small" | "large";
}

const SEEDS: Seed[] = [
  // ——— The Little Fox: ears → cheeks → nose → forehead → eyes ———
  { id: "fox-1", offset: 0, title: "The First Step", message: "You made it this far. That's worth a tiny star.", x: 8, y: 8, constellationId: "little-fox" },
  { id: "fox-2", offset: 1, title: "Small Days", message: "Some days are small, and that's okay. You don't have to make every day special.", x: 32, y: 8, constellationId: "little-fox" },
  { id: "fox-3", offset: 2, title: "Good Luck, Pocket-Sized", message: "Here's a little piece of good luck for today. Keep it somewhere warm.", x: 20, y: 28, constellationId: "little-fox" },
  { id: "fox-4", offset: 3, title: "The Penguin Fact", message: "Penguins propose with pebbles. Consider this pebble yours.", x: 11, y: 22, constellationId: "little-fox" },
  { id: "fox-5", offset: 4, title: "Quietly Proud", message: "Someone out there is quietly proud of you. No occasion needed.", x: 29, y: 22, constellationId: "little-fox" },
  { id: "fox-6", offset: 5, title: "The Bright Mark", message: "Not every day needs to be productive. Some days are just for curling up.", x: 20, y: 12, constellationId: "little-fox" },
  { id: "fox-7", offset: 6, title: "One Bright Eye", message: "A small bright eye, watching kindly. The fox is starting to notice you.", x: 15, y: 18, constellationId: "little-fox", size: "small" },
  { id: "fox-8", offset: 7, title: "Two Bright Eyes", message: "And now it sees you completely. Say hello quietly.", x: 25, y: 18, constellationId: "little-fox", size: "small" },
  // ——— The Moon Rabbit: long ears, round body, tail, and a crumb of moon ———
  { id: "rab-1", offset: 8, title: "Unexpectedly Nice", message: "I hope something unexpectedly nice finds you today.", x: 62, y: 11, constellationId: "moon-rabbit" },
  { id: "rab-2", offset: 9, title: "Future You", message: "I wonder what your future self is doing right now. Probably smiling about this.", x: 63, y: 32, constellationId: "moon-rabbit" },
  { id: "rab-3", offset: 10, title: "The Raccoon Knows", message: "A raccoon somewhere believes in you. Don't ask how I know.", x: 86, y: 20, constellationId: "moon-rabbit", size: "small" },
  { id: "rab-4", offset: 11, title: "Long Ears, Listening", message: "If tonight had a smell, what would it be? Keep the answer. It's yours.", x: 60, y: 20, constellationId: "moon-rabbit" },
  { id: "rab-5", offset: 12, title: "Soft Landing", message: "Rest is also a kind of adventure. The rabbit naps mid-hop and feels zero guilt.", x: 55, y: 23, constellationId: "moon-rabbit", size: "small" },
  { id: "rab-6", offset: 13, title: "Dust of Curiosity", message: "What would you tell the stars if they answered? The rabbit is taking notes.", x: 69, y: 22, constellationId: "moon-rabbit" },
  { id: "rab-7", offset: 14, title: "The Heartbeat", message: "Close your eyes for ten seconds. That's a gift from the quiet part of the sky.", x: 90, y: 24, constellationId: "moon-rabbit", size: "small" },
  { id: "rab-8", offset: 15, title: "A Fluffy Full Stop", message: "A fluffy full stop at the end of a soft sentence.", x: 73, y: 28, constellationId: "moon-rabbit", size: "small" },
  { id: "rab-9", offset: 16, title: "The Third Light", message: "The little moon keeps its third light for last.", x: 86, y: 28, constellationId: "moon-rabbit", size: "small" },
  { id: "rab-10", offset: 17, title: "Both Ears Now", message: "Two ears now, both listening. You have the rabbit's full attention.", x: 67, y: 10, constellationId: "moon-rabbit" },
  // ——— The Little Flower: six petals, and the heart appears last ———
  { id: "flo-1", offset: 18, title: "First Petal", message: "Something is beginning to bloom up there.", x: 43, y: 16, constellationId: "little-flower" },
  { id: "flo-2", offset: 19, title: "Second Petal", message: "A second petal. The sky is learning symmetry.", x: 43, y: 32, constellationId: "little-flower" },
  { id: "flo-3", offset: 20, title: "Third Petal", message: "Petals three. Whatever this becomes, it's patient.", x: 36, y: 20, constellationId: "little-flower" },
  { id: "flo-4", offset: 21, title: "The Far Petal", message: "The far petal found its place without being asked.", x: 50, y: 28, constellationId: "little-flower" },
  { id: "flo-5", offset: 22, title: "Almost", message: "Almost a circle. Almost a flower. Almost.", x: 36, y: 28, constellationId: "little-flower" },
  { id: "flo-6", offset: 23, title: "The Empty Middle", message: "Six petals, holding an empty middle. Something belongs there.", x: 50, y: 20, constellationId: "little-flower" },
  { id: "flo-7", offset: 24, title: "The Heart", message: "The heart of the flower. It was waiting for all the others.", x: 43, y: 24, constellationId: "little-flower" },
  // ——— The Wanderer: a small figure striding right, lantern in hand ———
  { id: "wan-1", offset: 25, title: "First Footprint", message: "Every trail starts with one unserious little step. Take it sideways if you like.", x: 46, y: 55, constellationId: "wanderer" },
  { id: "wan-2", offset: 26, title: "Pocket Beautiful Thing", message: "Today's mission, should you accept it: find one small beautiful thing.", x: 38, y: 76, constellationId: "wanderer" },
  { id: "wan-3", offset: 27, title: "Far Lantern", message: "Even fireflies need the dark to shine. Be patient with the dark.", x: 60, y: 66, constellationId: "wanderer" },
  { id: "wan-4", offset: 28, title: "The Crossroads", message: "You don't have to glow to be a star. Dim is a perfectly good brightness.", x: 54, y: 76, constellationId: "wanderer" },
  { id: "wan-5", offset: 29, title: "Warm Cup", message: "Blanket. Tea. Stars. In that order. The wanderer insists.", x: 46, y: 62, constellationId: "wanderer" },
  { id: "wan-6", offset: 30, title: "Wind Chime", message: "You laugh like a wind chime in a good breeze. The trail heard it.", x: 36, y: 60, constellationId: "wanderer" },
  { id: "wan-7", offset: 31, title: "Cloud Thoughts", message: "If thoughts were clouds, let this one drift by. You don't have to chase it.", x: 56, y: 63, constellationId: "wanderer" },
  { id: "wan-8", offset: 32, title: "The Detour", message: "One day this tired evening will be a soft memory. The detour was the point.", x: 46, y: 68, constellationId: "wanderer" },
  { id: "wan-9", offset: 33, title: "The Lantern-Star", message: "Someone hung a lantern-star ahead of you. Walk toward it slowly.", x: 50, y: 44, constellationId: "wanderer", size: "large" },
];

export const STARS: Star[] = SEEDS.map((s) => ({
  id: s.id,
  title: s.title,
  message: s.message,
  unlockDate: at(s.offset),
  position: { x: s.x, y: s.y },
  constellationId: s.constellationId,
  type: "message",
  size: s.size,
}));

/** Hidden star — not on the schedule. Wakes when the moon is tapped three times. */
export const SECRET_STAR: Star = {
  id: "secret-moon",
  title: "The Moon's Secret",
  message: "Psst. You found the one star that wasn't supposed to be found. Curious little thing, aren't you? Keep it.",
  unlockDate: "2099-01-01",
  position: { x: 84, y: 8 },
  type: "secret",
  unlockCondition: { type: "interaction", value: "moon-3-taps" },
};

export const CONSTELLATIONS: Constellation[] = [
  {
    id: "little-fox",
    name: "The Little Fox",
    description: "Two ears, bright eyes, one lucky nose. Some things only make sense when you see them together.",
    after: "Far to the east, two long ears are listening…",
    starIds: ["fox-1", "fox-2", "fox-3", "fox-4", "fox-5", "fox-6", "fox-7", "fox-8"],
    connections: [["fox-1", "fox-4"], ["fox-4", "fox-3"], ["fox-3", "fox-5"], ["fox-5", "fox-2"], ["fox-2", "fox-6"], ["fox-6", "fox-1"], ["fox-7", "fox-6"], ["fox-8", "fox-6"]],
    revealed: false,
  },
  {
    id: "moon-rabbit",
    name: "The Moon Rabbit",
    description: "A rabbit sitting beside a crumb of moon, ears full of questions, heart full of naps.",
    after: "Lower in the sky, something is learning symmetry…",
    starIds: ["rab-1", "rab-2", "rab-3", "rab-4", "rab-5", "rab-6", "rab-7", "rab-8", "rab-9", "rab-10"],
    connections: [["rab-1", "rab-4"], ["rab-4", "rab-5"], ["rab-4", "rab-6"], ["rab-6", "rab-8"], ["rab-8", "rab-2"], ["rab-2", "rab-4"], ["rab-10", "rab-4"], ["rab-3", "rab-7"], ["rab-7", "rab-9"]],
    revealed: false,
  },
  {
    id: "little-flower",
    name: "The Little Flower",
    description: "Six petals around one warm heart. It bloomed one quiet light at a time.",
    after: "Low in the dark — footsteps. Someone is walking with a lantern…",
    starIds: ["flo-1", "flo-2", "flo-3", "flo-4", "flo-5", "flo-6", "flo-7"],
    connections: [["flo-7", "flo-1"], ["flo-7", "flo-2"], ["flo-7", "flo-3"], ["flo-7", "flo-4"], ["flo-7", "flo-5"], ["flo-7", "flo-6"]],
    revealed: false,
  },
  {
    id: "wanderer",
    name: "The Wanderer",
    description: "A small figure crossing the low sky, lantern in hand, beneath a lantern-star. For evenings when staying still felt impossible.",
    after: "The sky is whole — for now. Keep looking up anyway.",
    starIds: ["wan-1", "wan-2", "wan-3", "wan-4", "wan-5", "wan-6", "wan-7", "wan-8", "wan-9"],
    connections: [["wan-1", "wan-5"], ["wan-5", "wan-8"], ["wan-8", "wan-4"], ["wan-8", "wan-2"], ["wan-5", "wan-7"], ["wan-7", "wan-3"], ["wan-5", "wan-6"]],
    revealed: false,
  },
];

export const ALL_STARS: Star[] = [...STARS, SECRET_STAR];

export function starById(id: string): Star | undefined {
  return ALL_STARS.find((s) => s.id === id);
}
