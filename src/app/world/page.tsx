"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Moon } from "lucide-react";
import { getPoetryState } from "@/services/poetry-service";
import { usePrefs } from "@/lib/prefs";
import { moodOrDefault } from "@/lib/moods";
import { useStars } from "@/lib/star-store";
import { sfx } from "@/lib/audio";
import { BackdropStars, Dust, Nebula } from "@/components/sky/decor";

function PoetryCard() {
  const [hint, setHint] = useState("three pages wait along the way");
  const [hasNew, setHasNew] = useState(false);
  useEffect(() => {
    const s = getPoetryState();
    const ids = ["the-shade-you-gave-me", "the-blue-hour", "small-suns"];
    const kept = ids.filter((id) => s.pages[id]?.keptAt).length;
    const opened = ids.filter((id) => s.pages[id]?.discoveredAt).length;
    setHasNew(ids.some((id) => !s.pages[id]?.discoveredAt));
    if (kept === ids.length) setHint("every page kept · the shelf glows softly");
    else if (kept > 0) setHint(`${kept} of ${ids.length} pages kept`);
    else if (opened > 0) setHint("a page lies open, half-read");
  }, []);
  return (
    <Link
      href="/poetry"
      onClick={() => sfx.open()}
      className="group relative block overflow-hidden rounded-[28px] border border-white/12 transition active:scale-[0.99]"
      style={{ background: "linear-gradient(170deg, #1c1330 0%, #0b0918 78%)", boxShadow: "0 0 26px rgba(122,31,31,.22), 0 14px 40px rgba(0,0,0,.45)" }}
      aria-label="Things I left along the way — open the poetry pages"
    >
      {hasNew && (
        <span className="absolute right-4 top-4 flex h-3 w-3" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: "#ff7a6b", animationDuration: "2s" }} />
          <span className="relative inline-flex h-3 w-3 rounded-full" style={{ background: "#ff6b5e", boxShadow: "0 0 8px 2px rgba(255,107,94,.6)" }} />
        </span>
      )}
      <div className="flex items-center gap-4 px-6 py-5 text-left">
        <span className="paper-texture relative block h-16 w-12 shrink-0 rounded-[3px] bg-[#f5ecdd] shadow" style={{ transform: "rotate(-4deg)" }} aria-hidden>
          <span className="absolute inset-x-2 top-3 space-y-1" aria-hidden>
            <span className="block h-px bg-stone-800/30" />
            <span className="block h-px bg-stone-800/30" />
            <span className="block h-px bg-stone-800/30" />
            <span className="mx-auto mt-1 block h-1.5 w-1.5 rounded-full" style={{ background: "#7a1f1f" }} />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl italic text-amber-50">things i left along the way</span>
          <span className="mt-0.5 block font-body text-[12px] text-white/55">{hint}</span>
        </span>
        <span className="shrink-0 font-body text-lg text-amber-200 transition-transform group-hover:translate-x-0.5">→</span>
      </div>
    </Link>
  );
}

function ResetJourney() {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  const reset = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("ksw-") && k !== "ksw-mute")
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    window.location.assign(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`);
  };
  return (
    <button
      onClick={reset}
      className="mt-4 font-body text-[11px] text-white/30 underline-offset-4 hover:text-white/50 active:scale-95"
      aria-live="polite"
    >
      {armed ? "tap again to forget everything…" : "start over"}
    </button>
  );
}

export default function Home() {  const { mood } = usePrefs();
  const m = moodOrDefault(mood);
  const { availableCount, discoveredCount } = useStars();

  return (
    <main
      className="relative flex min-h-[100dvh] flex-col overflow-hidden"
      style={{ background: "linear-gradient(180deg, #04061a 0%, #0a1030 50%, #18224d 100%)" }}
    >
      <div className="absolute inset-0" aria-hidden>
        <Nebula />
        <BackdropStars motion />
        <Dust motion />
      </div>

      {/* top bar: mood · stars · album */}
      <header className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between gap-2 px-4 pt-[max(0.9rem,env(safe-area-inset-top))]">
        <Link
          href="/mood"
          onClick={() => sfx.tap()}
          className="flex items-center gap-2 rounded-full bg-black/35 px-3.5 py-2.5 backdrop-blur-md active:scale-95"
          aria-label="Change mood"
        >
          <span className="text-base leading-none">{m.emoji}</span>
          <span className="font-body text-xs text-amber-50">{m.name}</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-black/35 px-3.5 py-2.5 font-body text-xs text-amber-100 backdrop-blur-md" aria-live="polite">
            ✦ {discoveredCount}
          </div>
          <Link
            href="/badges"
            onClick={() => sfx.tap()}
            className="rounded-full bg-amber-200/90 p-2.5 text-stone-900 active:scale-95"
            aria-label="Star album"
          >
            <Moon size={15} />
          </Link>
        </div>
      </header>

      {/* shelf of little worlds */}
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full text-center">
          <p className="font-body text-[11px] uppercase tracking-[0.35em] text-amber-100/60">kleine sternenwelt</p>
          <h1 className="mt-2 font-display text-3xl italic text-amber-50">where to tonight?</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mt-6 w-full space-y-3">
          {/* night of stars — the one world, for now */}
          <Link
            href="/sky"
            onClick={() => sfx.open()}
            className="group relative block overflow-hidden rounded-[28px] border shadow-soft transition active:scale-[0.99]"
            style={{ borderColor: m.palette.glass, background: `linear-gradient(170deg, ${m.sky[1]} 0%, ${m.sky[0]} 78%)`, boxShadow: `0 0 34px ${m.palette.glow}, 0 14px 40px rgba(0,0,0,.45)` }}
            aria-label={`Night of stars — ${availableCount > 0 ? `${availableCount} stars waiting` : "look up"}`}
          >
            {availableCount > 0 && (
              <span className="absolute right-4 top-4 z-10 flex h-3 w-3" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: "#ff7a6b", animationDuration: "2s" }} />
                <span className="relative inline-flex h-3 w-3 rounded-full" style={{ background: "#ff6b5e", boxShadow: "0 0 8px 2px rgba(255,107,94,.6)" }} />
              </span>
            )}
            <div className="relative px-6 pb-6 pt-7 text-center">
              {/* living preview of the actual sky */}
              <div className="relative mx-auto h-28 w-full max-w-[260px] overflow-hidden rounded-2xl border border-white/10" style={{ background: `linear-gradient(180deg, ${m.sky[0]}, ${m.sky[2]})` }} aria-hidden>
                {[
                  { l: "18%", t: "30%" }, { l: "38%", t: "12%" }, { l: "58%", t: "28%" }, { l: "74%", t: "10%" },
                  { l: "84%", t: "44%" }, { l: "30%", t: "58%" }, { l: "52%", t: "66%" }, { l: "68%", t: "60%" },
                ].map((p, i) => (
                  <span key={i} className="absolute h-1 w-1 rounded-full" style={{ left: p.l, top: p.t, background: m.palette.accent, opacity: 0.5 + (i % 3) * 0.25, boxShadow: `0 0 6px 2px ${m.palette.glow}` }} />
                ))}
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                  <line x1="38" y1="12" x2="58" y2="28" stroke={m.palette.accent} strokeOpacity={0.5} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
                  <line x1="58" y1="28" x2="74" y2="10" stroke={m.palette.accent} strokeOpacity={0.5} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
                  <line x1="30" y1="58" x2="52" y2="66" stroke={m.palette.accent} strokeOpacity={0.35} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
                </svg>
                <span className="absolute rounded-full bg-[#fdf3d0]" style={{ right: "6%", top: "4%", width: 18, height: 18, boxShadow: `0 0 14px 4px ${m.palette.glow}` }} />
                {availableCount > 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 font-body text-[10px] font-bold text-amber-100">✦ {availableCount} waiting</span>
                )}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2.5">
                <span className="text-2xl" style={{ color: m.palette.accent }}>✦</span>
                <span className="font-display text-2xl italic text-amber-50">night of stars</span>
              </div>
              <p className="mt-1.5 font-body text-[13px] text-white/60">
                {availableCount > 0
                  ? `${availableCount} star${availableCount > 1 ? "s are" : " is"} waiting tonight`
                  : discoveredCount > 0
                    ? "the sky is quiet — visit your kept stars"
                    : "every little moment becomes a star"}
              </p>
              <span className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-amber-100 px-6 py-3 font-body text-sm font-semibold text-stone-900 shadow-glow">
                look up <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </div>
          </Link>

          {/* things i left along the way — the poetry shelf */}
          <PoetryCard />

          {/* room on the shelf for whatever comes next */}
          <div className="rounded-[28px] border border-dashed border-white/15 px-6 py-5 text-center" aria-label="More little worlds are still forming">
            <p className="font-display text-[15px] italic text-white/40">✦ something else is still forming…</p>
            <p className="mt-0.5 font-body text-[11px] text-white/30">the shelf has room for more worlds</p>
          </div>
          <ResetJourney />
        </motion.div>
      </div>
    </main>
  );
}
