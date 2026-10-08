export type MoodId =
  | "peaceful"
  | "happy"
  | "sad"
  | "loved"
  | "tired"
  | "angry"
  | "overwhelmed";

export interface MoodPalette {
  background: string;
  background2: string;
  foreground: string;
  accent: string;
  glow: string;
  glass: string;
}

export interface Mood {
  id: MoodId;
  name: string;
  tagline: string;
  emoji: string;
  palette: MoodPalette;
  sky: string[];
  particle: "stars" | "glow" | "rain" | "snow" | "embers" | "mist";
  particleCount: number;
  speed: number;
  dim: number;
  soundHint: string;
}

export const MOODS: Record<MoodId, Mood> = {
  peaceful: {
    id: "peaceful",
    name: "Peaceful",
    tagline: "soft blue, slow stars",
    emoji: "🌙",
    palette: { background: "#0b1530", background2: "#16224d", foreground: "#e8eefc", accent: "#8fb4ff", glow: "rgba(143,180,255,0.35)", glass: "rgba(143,180,255,0.12)" },
    sky: ["#070d24", "#0b1530", "#16224d"],
    particle: "stars",
    particleCount: 90,
    speed: 0.5,
    dim: 0.15,
    soundHint: "soft night air",
  },
  happy: {
    id: "happy",
    name: "Happy",
    tagline: "warm golden light",
    emoji: "☀️",
    palette: { background: "#1a1330", background2: "#4a2c14", foreground: "#fff6e3", accent: "#ffcf6e", glow: "rgba(255,207,110,0.45)", glass: "rgba(255,207,110,0.14)" },
    sky: ["#141031", "#3a2340", "#6b3d1e"],
    particle: "glow",
    particleCount: 120,
    speed: 1.1,
    dim: 0,
    soundHint: "warm crackle",
  },
  sad: {
    id: "sad",
    name: "Sad",
    tagline: "deep blue, gentle rain",
    emoji: "🌧️",
    palette: { background: "#060b1e", background2: "#0e1b3d", foreground: "#dbe4f7", accent: "#6d8dff", glow: "rgba(109,141,255,0.28)", glass: "rgba(109,141,255,0.10)" },
    sky: ["#040814", "#060b1e", "#0e1b3d"],
    particle: "rain",
    particleCount: 110,
    speed: 0.7,
    dim: 0.35,
    soundHint: "gentle rain",
  },
  loved: {
    id: "loved",
    name: "Loved",
    tagline: "warm pink glow",
    emoji: "💗",
    palette: { background: "#1c0f26", background2: "#4a1e3a", foreground: "#ffeef4", accent: "#ff9ebb", glow: "rgba(255,158,187,0.42)", glass: "rgba(255,158,187,0.14)" },
    sky: ["#160b22", "#2c1438", "#5a2440"],
    particle: "glow",
    particleCount: 110,
    speed: 0.8,
    dim: 0.05,
    soundHint: "soft humming",
  },
  tired: {
    id: "tired",
    name: "Tired",
    tagline: "muted purple, very slow",
    emoji: "😴",
    palette: { background: "#100f24", background2: "#2b2547", foreground: "#e6e2f5", accent: "#b3a6e8", glow: "rgba(179,166,232,0.28)", glass: "rgba(179,166,232,0.10)" },
    sky: ["#0b0a1c", "#171531", "#2b2547"],
    particle: "mist",
    particleCount: 60,
    speed: 0.3,
    dim: 0.4,
    soundHint: "distant night",
  },
  angry: {
    id: "angry",
    name: "Angry",
    tagline: "muted ember warmth",
    emoji: "🔥",
    palette: { background: "#1c0d10", background2: "#4a1f16", foreground: "#ffede4", accent: "#ff8a5c", glow: "rgba(255,138,92,0.35)", glass: "rgba(255,138,92,0.12)" },
    sky: ["#120709", "#241016", "#4a1f16"],
    particle: "embers",
    particleCount: 90,
    speed: 1.3,
    dim: 0.2,
    soundHint: "low fire",
  },
  overwhelmed: {
    id: "overwhelmed",
    name: "Overwhelmed",
    tagline: "deep violet, simplified",
    emoji: "🌌",
    palette: { background: "#0d0a24", background2: "#241b4d", foreground: "#e9e6ff", accent: "#9d8bff", glow: "rgba(157,139,255,0.30)", glass: "rgba(157,139,255,0.10)" },
    sky: ["#080716", "#131036", "#241b4d"],
    particle: "mist",
    particleCount: 45,
    speed: 0.4,
    dim: 0.45,
    soundHint: "quiet void",
  },
};

export const MOOD_LIST = Object.values(MOODS);

export function moodOrDefault(id: string | null | undefined): Mood {
  if (id && (MOODS as Record<string, Mood>)[id]) return (MOODS as Record<string, Mood>)[id];
  return MOODS.peaceful;
}
