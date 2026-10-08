import type { Poem } from "@/types/poetry";

export const POEMS: Poem[] = [
  {
    id: "the-shade-you-gave-me",
    title: "The Shade You Gave Me",
    type: "special",
    theme: {
      accent: "#7a1f1f",
      accentSoft: "rgba(122,31,31,0.35)",
      paperWarm: "#f6e7d2",
      finalEffect: "rising-star",
    },
    blocks: [
      {
        id: "s1",
        stage: 1,
        lines: [
          "I never thought much of red.",
          "It was loud,",
          "Too bold.",
          "Never quiet enough to sit with.",
          "Never soft enough to hold.",
        ],
      },
      {
        id: "s2",
        stage: 2,
        emphasis: "dark red",
        lines: ["But then you looked at me,", "and said my color was dark red."],
      },
      {
        id: "s3a",
        stage: 3,
        lines: [
          "And suddenly, red meant something else.",
          "It wasn't just heat or warning signs anymore,",
          "it was warmth... It was depth...",
        ],
      },
      {
        id: "s3b",
        stage: 4,
        lines: ["A steady burn, like something that stays with you,", "even when everything else fades."],
      },
      {
        id: "s4a",
        stage: 5,
        lines: [
          "I've never seen red as beautiful as I do now.",
          "It wasn't my favorite.",
          "Not until you saw it in me.",
        ],
      },
      {
        id: "s4b",
        stage: 6,
        lines: ["Not until you made it feel like something worth keeping."],
      },
      {
        id: "s5",
        stage: 7,
        lines: [
          "Maybe that's love...",
          "a color you never cared for,",
          "until someone you love says,",
          "\u201CThis is what I see when I look at you.\u201D",
          "And suddenly, you see it too.",
        ],
      },
    ],
  },
  {
    id: "the-blue-hour",
    title: "The Blue Hour",
    type: "special",
    theme: {
      accent: "#2b4a73",
      accentSoft: "rgba(43,74,115,0.35)",
      paperWarm: "#f6e7d2",
      finalEffect: "rising-star",
    },
    blocks: [
      {
        id: "s1",
        stage: 1,
        lines: [
          "I never trusted blue.",
          "It was far away,",
          "Cold glass.",
          "The wrong side of the window.",
          "Beautiful the way winter is —",
          "from indoors.",
        ],
      },
      {
        id: "s2",
        stage: 2,
        emphasis: "blue hour",
        lines: ["But then you said the evening had a name,", "and its name was the blue hour."],
      },
      {
        id: "s3a",
        stage: 3,
        lines: [
          "And suddenly the evening softened.",
          "It wasn't empty anymore,",
          "it was held... It was patient...",
        ],
      },
      {
        id: "s3b",
        stage: 4,
        lines: ["A low lamp in a blue room,", "the kind of light that stays on for you,", "even when the street goes quiet."],
      },
      {
        id: "s4a",
        stage: 5,
        lines: [
          "I've never loved an evening the way I love this one.",
          "Not the grand sunsets.",
          "This one. The small blue one.",
          "The one where you look up from your book",
          "and smile without saying why.",
        ],
      },
      {
        id: "s4b",
        stage: 6,
        lines: ["Keep this hour. Fold it small.", "It fits in a pocket,", "in case a day ever feels too loud."],
      },
      {
        id: "s5",
        stage: 7,
        lines: [
          "Maybe that's peace...",
          "not the absence of noise,",
          "but one blue hour,",
          "kept warm between two people,",
          "saying nothing,",
          "and meaning everything.",
        ],
      },
    ],
  },
  {
    id: "small-suns",
    title: "Small Suns",
    type: "special",
    theme: {
      accent: "#96600f",
      accentSoft: "rgba(150,96,15,0.35)",
      paperWarm: "#f6e7d2",
      finalEffect: "rising-star",
    },
    blocks: [
      {
        id: "s1",
        stage: 1,
        lines: [
          "I never collected mornings.",
          "They were early,",
          "Too bright.",
          "Never slow enough to keep.",
          "Never gold enough to matter.",
        ],
      },
      {
        id: "s2",
        stage: 2,
        emphasis: "small suns",
        lines: ["But then you lined three jars along the sill,", "and called them small suns."],
      },
      {
        id: "s3a",
        stage: 3,
        lines: [
          "And suddenly the light had somewhere to land.",
          "It wasn't glare anymore,",
          "it was honey... It was held...",
        ],
      },
      {
        id: "s3b",
        stage: 4,
        lines: ["A warm cup gone quiet between both hands,", "the kind of heat that stays a while,", "even after the tea is gone."],
      },
      {
        id: "s4a",
        stage: 5,
        lines: [
          "I've never watched dust the way I watch it now.",
          "Turning in the light.",
          "In no hurry.",
          "Like it finally has",
          "somewhere to be.",
        ],
      },
      {
        id: "s4b",
        stage: 6,
        lines: ["Keep this morning. It asked for nothing.", "It only wanted", "to be noticed once."],
      },
      {
        id: "s5",
        stage: 7,
        lines: [
          "Maybe that's joy...",
          "not the big bright days,",
          "but three small suns on a sill,",
          "and someone beside you",
          "who saw them first.",
        ],
      },
    ],
  },
];

export function poemById(id: string): Poem | undefined {
  return POEMS.find((p) => p.id === id);
}
