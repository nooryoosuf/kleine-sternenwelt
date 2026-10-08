"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MOOD_LIST, moodOrDefault } from "@/lib/moods";
import { usePrefs } from "@/lib/prefs";
import { sfx } from "@/lib/audio";
import { BackdropStars, Nebula } from "@/components/sky/decor";

const DEFAULT_BG = "linear-gradient(180deg, #04061a 0%, #0a1030 50%, #18224d 100%)";

export default function MoodPage() {
  const { mood: stored, setMood } = usePrefs();
  const [sel, setSel] = useState<(typeof MOOD_LIST)[number]["id"] | null>(stored);
  const router = useRouter();
  const preview = sel ? moodOrDefault(sel) : null;

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
      className="relative min-h-[100dvh] px-5 pb-32 pt-[max(1rem,env(safe-area-inset-top))]"
      style={{ background: preview ? `linear-gradient(180deg, ${preview.sky[0]} 0%, ${preview.sky[1]} 55%, ${preview.sky[2]} 100%)` : DEFAULT_BG, transition: "background 1s ease" }}
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

        {/* live preview of the picked sky */}
        <AnimatePresence>
          {preview && (
            <motion.div
              key={preview.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 overflow-hidden rounded-3xl border border-white/15 shadow-soft"
              aria-live="polite"
            >
              <div className="relative h-28" style={{ background: `linear-gradient(180deg, ${preview.sky[0]}, ${preview.sky[2]})` }} aria-hidden>
                <span className="absolute rounded-full bg-[#fdf3d0]" style={{ right: "14%", top: "18%", width: 26, height: 26, boxShadow: `0 0 20px 6px ${preview.palette.glow}` }} />
                {[12, 30, 52, 68, 84].map((l, i) => (
                  <span key={i} className="absolute rounded-full bg-white" style={{ left: `${l}%`, top: `${22 + ((i * 23) % 55)}%`, width: 2 + (i % 2), height: 2 + (i % 2), opacity: 0.8 }} />
                ))}
              </div>
              <div className="bg-black/45 px-5 py-4 backdrop-blur-md">
                <p className="font-body text-[11px] uppercase tracking-[0.3em] text-amber-100/60">your sky will feel like this</p>
                <p className="mt-1 font-display text-xl italic text-amber-50">{preview.emoji} {preview.name} <span className="text-white/50">· {preview.tagline}</span></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* progress button */}
      <AnimatePresence>
        {sel && preview && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="fixed inset-x-0 bottom-0 z-20 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6"
            style={{ background: "linear-gradient(180deg, transparent, rgba(0,0,0,.55))" }}
          >
            <div className="mx-auto max-w-md">
              <p className="mb-2 text-center font-body text-[11px] text-white/50">① mood picked · ② step inside</p>
              <button
                onClick={go}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-100 px-7 py-4 font-body text-[15px] font-semibold text-stone-900 shadow-glow transition active:scale-95"
              >
                Step inside as {preview.name} <ArrowRight size={17} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
