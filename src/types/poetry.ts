export interface PoemBlock {
  id: string;
  /** transformation stage reached when this block is read */
  stage: number;
  lines: string[];
  /** phrase rendered in the poem's deep accent once its stage is reached */
  emphasis?: string;
}

export interface PoetryVisualTheme {
  /** main deep accent, e.g. dark red */
  accent: string;
  /** soft glow form of the accent */
  accentSoft: string;
  /** warmed paper tone at the end of the journey */
  paperWarm: string;
  finalEffect: "rising-star";
}

export interface Poem {
  id: string;
  title: string;
  type: "special";
  blocks: PoemBlock[];
  theme: PoetryVisualTheme;
}

export interface PoetryPageState {
  discoveredAt?: string;
  keptAt?: string;
}

export interface PoetryPersist {
  introSeen: boolean;
  pages: Record<string, PoetryPageState>;
}
