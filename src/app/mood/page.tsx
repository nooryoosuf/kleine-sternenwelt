"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MOOD_LIST } from "@/lib/moods";
import { usePrefs } from "@/lib/prefs";
import { sfx } from "@/lib/audio";
import { BackdropStars, Nebula } from "@/components/sky/decor";

const DEFAULT_BG = "linear-gradient(180deg, #04061a 0%, #0a1030 50%, #18224d 100%)";

export default function MoodPage() {
  const { mood: stored, setMood } = usePrefs();
  const [sel, setSel] = useState<(typeof MOOD_LIST)[number]["id"] | null>(stored);
  const router = useRouter();
  const picked = sel ? MOOD_LIST.find((m) => m.id === sel) : undefined;

  const choose = (id: (typeof MOOD_LIST)[number]["id"]) => {
    setSel(id);
    setMood(id);
    sfx.tap();
  };

  const go = () => {
    if (!sel) return;
    sfx.open();
    router.push("/world");
  };

  return (
    <main
      className="relative min-h-[100dvh] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
      style={{ background: picked ? `linear-gradient(180deg, ${picked.sky[0]} 0%, ${picked.sky[1]} 55%, ${picked.sky[2]} 100%)` : DEFAULT_BG, transition: "background 1s ease" }}
    >
      <div className="absolute inset-0" aria-hidden>
        <Nebula />
        <BackdropStars motion />
      </div>
      <div className="relative mx-auto max-w-md">
        <Link
          href="/"
          onClick={() => sfx.tap()}
          className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3.5 py-2.5 font-body text-xs text-amber-50 backdrop-blur-md active:scale-95"
          aria-label="Back to the entrance"
        >
          <ArrowLeft size={15} />
        </Link>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <p className="text-center font-body text-[11px] uppercase tracking-[0.3em] text-amber-100/60">step inside</p>
          <h1 className="mt-2 text-center font-display text-3xl italic text-amber-50">How does your little world feel today?</h1>
          <p className="mt-2 text-center font-body text-sm text-white/55">No why. Just pick the sky — then step in.</p>
        </motion.div>

        <div className="mt-6 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Choose a mood">
          {MOOD_LIST.map((m, i) => {
            const active = sel === m.id;
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => choose(m.id)}
                role="radio"
                aria-checked={active}
                className={`relative overflow-hidden rounded-3xl border p-4 text-left transition active:scale-95 ${active ? "border-amber-200/80" : "border-white/10"}`}
                style={{ background: `linear-gradient(160deg, ${m.sky[1]}cc, ${m.sky[0]}ee)`, boxShadow: active ? `0 0 28px ${m.palette.glow}` : undefined }}
              >
                <div className="text-2xl">{m.emoji}</div>
                <div className="mt-2 font-display text-lg italic text-amber-50">{m.name}</div>
                <div className="font-body text-[11px] text-white/55">{m.tagline}</div>
                {active && <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-xs text-stone-900">✓</div>}
              </motion.button>
            );
          })}
        </div>

        {/* progress button — in-flow and sticky, so it never covers content or the home bar */}
        <AnimatePresence>
          {picked && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-10 mt-6"
            >
              <p className="mb-2 text-center font-body text-[11px] text-white/60">
                ① {picked.emoji} {picked.name} picked · ② step inside
              </p>
              <button
                onClick={go}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-100 px-5 py-4 font-body text-[15px] font-semibold text-stone-900 shadow-glow transition active:scale-95"
              >
                Step inside <ArrowRight size={17} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
