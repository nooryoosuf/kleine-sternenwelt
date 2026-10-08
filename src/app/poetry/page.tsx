"use client";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Info, X } from "lucide-react";
import { POEMS, poemById } from "@/data/poems";
import {
  getPoetryState,
  markPoemDiscovered,
  markPoemKept,
  resetPoem,
  resetPoetryAll,
  setPoetryIntroSeen,
} from "@/services/poetry-service";
import { sfx } from "@/lib/audio";
import { BackdropStars, Nebula } from "@/components/sky/decor";
import type { Poem } from "@/types/poetry";
import type { PoetryPersist } from "@/types/poetry";

type Phase = "shelf" | "waiting" | "opening" | "reading" | "star" | "after" | "leaving" | "kept-reading";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

function PoetryView() {
  const search = useSearchParams();
  const dev = search.get("dev") === "1";
  const reduced = useReducedMotion();
  const motionOK = !reduced;

  const [intro, setIntro] = useState<boolean | null>(null);
  const [lib, setLib] = useState<PoetryPersist>({ introSeen: false, pages: {} });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("shelf");
  const [stage, setStage] = useState(1);
  const [infoOpen, setInfoOpen] = useState(false);
  const [starKey, setStarKey] = useState(0);
  const [keptMsg, setKeptMsg] = useState(false);
  const blockRefs = useRef<(HTMLElement | null)[]>([]);
  const timers = useRef<number[]>([]);

  const poem = activeId ? poemById(activeId) : null;
  const theme = poem?.theme ?? POEMS[0].theme;

  useEffect(() => {
    const s = getPoetryState();
    setLib(s);
    setIntro(!s.introSeen);
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    blockRefs.current = [];
  }, [activeId]);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const refresh = () => setLib(getPoetryState());

  // scroll-driven transformation: the furthest block read wins, never goes back
  useEffect(() => {
    if (!poem) return;
    if (phase !== "reading" && phase !== "after" && phase !== "star") return;
    const els = blockRefs.current.filter((el): el is HTMLElement => !!el);
    if (els.length === 0 || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const st = Number((e.target as HTMLElement).dataset.stage ?? 1);
            setStage((prev) => Math.max(prev, st));
          }
        }
      },
      { rootMargin: "-30% 0px -30% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [phase, intro, poem]);

  // the final star: pause after the last line, then it leaves
  useEffect(() => {
    if (!poem || phase !== "reading" || stage < 7) return;
    later(motionOK ? 2600 : 600, () => {
      setPhase("star");
      setStarKey((k) => k + 1);
      sfx.discover();
      later(motionOK ? 3400 : 800, () => setPhase("after"));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, stage, poem]);

  // escape closes the info panel
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInfoOpen(false);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const beginIntro = () => {
    sfx.open();
    setPoetryIntroSeen();
    refresh();
    setIntro(false);
  };

  const selectPoem = (id: string) => {
    const pg = getPoetryState().pages[id];
    sfx.tap();
    setKeptMsg(false);
    setStage(1);
    setActiveId(id);
    setPhase(pg?.keptAt ? "kept-reading" : "waiting");
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const backToShelf = () => {
    setActiveId(null);
    setPhase("shelf");
    refresh();
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const openPaper = () => {
    if (!poem) return;
    markPoemDiscovered(poem.id);
    refresh();
    sfx.paper();
    setPhase("opening");
    later(motionOK ? 2000 : 400, () => {
      setPhase("reading");
      setStage(1);
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  const keepPage = () => {
    if (!poem) return;
    markPoemKept(poem.id);
    refresh();
    sfx.soft();
    setPhase("leaving");
    later(motionOK ? 1700 : 400, () => {
      setActiveId(null);
      setPhase("shelf");
      refresh();
      setKeptMsg(true);
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  const readAgain = () => {
    setStage(1);
    setPhase("reading");
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const skipToFinal = () => {
    if (!poem) return;
    setPhase("reading");
    setStage(7);
    later(300, () => {
      document.getElementById("poem-block-s5")?.scrollIntoView({ behavior: motionOK ? "smooth" : "auto", block: "center" });
    });
  };

  const warm = stage >= 3;
  const paperBg = warm ? theme.paperWarm : "#f5ecdd";
  const breathing = stage === 3 && motionOK;
  const ember = stage >= 4;

  const renderLine = (line: string, emphasis?: string) => {
    if (!emphasis || !line.includes(emphasis)) return <span>{line}</span>;
    const lit = stage >= 2;
    const [a, b] = line.split(emphasis);
    return (
      <span>
        {a}
        <span style={{ color: lit ? theme.accent : undefined, transition: "color 2s ease" }}>{emphasis}</span>
        {b}
      </span>
    );
  };

  const paper = (p: Poem, interactive: boolean) => (
    <div className="relative">
      {/* red particles drifting nearby */}
      {stage >= 5 && motionOK && (
        <div className="pointer-events-none absolute -inset-8" aria-hidden>
          {[
            { l: "4%", t: "20%", d: "0s" },
            { l: "94%", t: "30%", d: "1.4s" },
            { l: "10%", t: "66%", d: "2.2s" },
            { l: "88%", t: "72%", d: "0.8s" },
            { l: "50%", t: "4%", d: "1.8s" },
          ].map((q, i) => (
            <span
              key={i}
              className="absolute h-1 w-1 rounded-full"
              style={{ left: q.l, top: q.t, background: theme.accent, opacity: 0.55, animation: `poem-drift 5s ease-in-out infinite`, animationDelay: q.d }}
            />
          ))}
        </div>
      )}

      <motion.div
        animate={
          phase === "waiting"
            ? { scale: 0.94, rotate: -1.5, y: 0, opacity: 1 }
            : phase === "leaving"
              ? { scale: 0.9, rotate: 1, y: 130, opacity: 0 }
              : { scale: 1, rotate: 0, y: 0, opacity: 1 }
        }
        transition={{ duration: motionOK ? 1.7 : 0.2, ease: "easeInOut" }}
        className="paper-texture relative rounded-[6px] px-7 py-9 shadow-soft sm:px-10"
        style={{
          background: paperBg,
          transition: "background 2.5s ease",
          boxShadow: ember
            ? `0 18px 50px rgba(0,0,0,.45), 0 0 46px 6px ${theme.accentSoft}`
            : "0 18px 50px rgba(0,0,0,.45)",
          animation: breathing ? "ember-breathe 5s ease-in-out infinite" : undefined,
        }}
      >
        <style>{`@keyframes ember-breathe { 0%,100% { box-shadow: 0 18px 50px rgba(0,0,0,.45), 0 0 22px 2px ${theme.accentSoft}; } 50% { box-shadow: 0 18px 50px rgba(0,0,0,.45), 0 0 54px 10px ${theme.accentSoft}; } } @keyframes poem-drift { 0%,100% { transform: translateY(0); opacity: .25; } 50% { transform: translateY(-14px); opacity: .6; } }`}</style>

        {/* fold crease while waiting */}
        {phase === "waiting" && <div className="absolute inset-x-9 top-1/2 h-px bg-stone-900/10" aria-hidden />}

        {/* faint accent mark at the edge — there from the start */}
        <div
          className="absolute right-5 top-8 h-8 w-8 rounded-full"
          style={{ background: `radial-gradient(circle, ${theme.accentSoft}, transparent 70%)`, opacity: stage >= 1 ? 0.35 + stage * 0.06 : 0, transition: "opacity 2.5s ease" }}
          aria-hidden
        />

        {/* reading thread — the page filling up */}
        {phase !== "waiting" && (
          <div className="absolute bottom-8 left-3 top-8 w-[2px] rounded-full bg-stone-900/10" aria-hidden>
            <div
              className="w-full rounded-full"
              style={{ height: `${Math.min(100, (stage / 7) * 100)}%`, background: theme.accent, opacity: 0.55, transition: "height 1.5s ease" }}
            />
          </div>
        )}

        {/* handmade ribbon — worth keeping */}
        <div
          className="absolute -right-1.5 top-12 w-5 rounded-b-md rounded-t-sm"
          style={{
            height: 92,
            background: `linear-gradient(180deg, ${theme.accent}, ${theme.accent})`,
            boxShadow: "0 4px 10px rgba(0,0,0,.3)",
            transform: stage >= 6 ? "scaleY(1)" : "scaleY(0)",
            transformOrigin: "top",
            transition: "transform 1.6s ease",
          }}
          aria-hidden
        />

        {/* title */}
        {phase !== "waiting" && (
          <div className="mb-8 text-center">
            <p className="font-body text-[10px] uppercase tracking-[0.35em] text-stone-500">a page for you</p>
            <h2 className="mt-1 font-display text-[26px] italic leading-tight text-stone-800">{p.title}</h2>
            <div className="mx-auto mt-3 h-px w-16 bg-stone-800/20" aria-hidden />
          </div>
        )}

        {phase !== "waiting" && (
          <div className="space-y-9">
            {p.blocks.map((b, bi) => (
              <section
                key={b.id}
                id={`poem-block-${b.id}`}
                data-stage={b.stage}
                ref={(el) => {
                  blockRefs.current[bi] = el;
                }}
              >
                {b.lines.map((line, li) => (
                  <p key={li} className="font-display text-[19px] italic leading-[1.9] text-stone-800">
                    {renderLine(line, b.emphasis)}
                  </p>
                ))}
                {/* ink stain blooming beneath the turning point */}
                {b.stage === 2 && (
                  <div
                    className="mx-auto mt-3 h-6 w-40 rounded-[50%]"
                    style={{ background: `radial-gradient(closest-side, ${theme.accentSoft}, transparent 75%)`, opacity: stage >= 2 ? 0.8 : 0, transition: "opacity 2.5s ease" }}
                    aria-hidden
                  />
                )}
              </section>
            ))}
          </div>
        )}

        {/* paper flecks — the color becoming beautiful */}
        {stage >= 5 && (
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {[
              { l: "18%", t: "30%" },
              { l: "82%", t: "55%" },
              { l: "64%", t: "82%" },
              { l: "30%", t: "74%" },
            ].map((q, i) => (
              <span key={i} className="absolute h-[3px] w-[3px] rounded-full" style={{ left: q.l, top: q.t, background: theme.accent, opacity: 0.5 }} />
            ))}
          </div>
        )}

        {/* ink vine — one leaf per stage */}
        {phase !== "waiting" && (
          <div className="pointer-events-none mt-10" aria-hidden>
            <svg viewBox="0 0 300 60" className="h-14 w-full">
              <path
                d="M6 52 C 70 48, 140 50, 294 26"
                fill="none"
                stroke={theme.accent}
                strokeOpacity={0.5}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeDasharray={300}
                strokeDashoffset={300 * (1 - Math.min(1, (stage - 1) / 6))}
                style={{ transition: "stroke-dashoffset 1.5s ease" }}
              />
              {[
                { x: 30, y: 51, flip: false },
                { x: 70, y: 50, flip: true },
                { x: 110, y: 49, flip: false },
                { x: 150, y: 47, flip: true },
                { x: 190, y: 43, flip: false },
                { x: 230, y: 38, flip: true },
                { x: 262, y: 33, flip: false },
              ].map((lf, i) => (
                <g key={i} transform={`translate(${lf.x} ${lf.y})${lf.flip ? " scale(-1 1)" : ""}`} opacity={stage >= i + 1 ? 0.75 : 0} style={{ transition: "opacity 1.2s ease" }}>
                  <path d="M0 0 q9 -3 14 -11 q-9 -1 -14 11" fill={theme.accent} />
                </g>
              ))}
              {stage >= 7 && (
                <circle cx={294} cy={26} r={3.2} fill={theme.accent} style={{ filter: `drop-shadow(0 0 5px ${theme.accentSoft})` }} />
              )}
            </svg>
          </div>
        )}
      </motion.div>

      {/* the final star detaching */}
      <AnimatePresence>
        {phase === "star" && (
          <motion.div key={`star-${starKey}`} className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center" aria-hidden>
            <motion.div className="relative flex flex-col items-center">
              <motion.span
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: motionOK ? -190 : -60, opacity: [0, 1, 1, 0] }}
                transition={{ duration: motionOK ? 3.2 : 0.8, ease: "easeOut" }}
                className="block h-2.5 w-2.5 rounded-full"
                style={{ background: "#ffe9d9", boxShadow: `0 0 14px 5px ${theme.accentSoft}, 0 0 34px 12px ${theme.accentSoft}` }}
              />
              <motion.span
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: motionOK ? 120 : 40, opacity: [0, 0.7, 0] }}
                transition={{ duration: motionOK ? 3.2 : 0.8, ease: "easeOut" }}
                className="block w-px"
                style={{ background: `linear-gradient(180deg, transparent, ${theme.accentSoft})` }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const keptCount = POEMS.filter((p) => lib.pages[p.id]?.keptAt).length;

  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(0.9rem,env(safe-area-inset-top))]"
      style={{ background: "linear-gradient(180deg, #0a0a24 0%, #141031 55%, #2a1f45 100%)" }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Nebula />
        <BackdropStars motion={motionOK} count={70} />
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(90% 55% at 50% 45%, ${theme.accentSoft}, transparent 75%)`, opacity: stage >= 3 && phase !== "waiting" && phase !== "shelf" ? 0.35 : 0, transition: "opacity 3s ease" }}
        />
      </div>

      {/* top bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between px-4">
        {poem ? (
          <button
            onClick={() => {
              sfx.tap();
              setActiveId(null);
              setPhase("shelf");
              refresh();
              window.scrollTo({ top: 0, behavior: "auto" });
            }}
            className="flex items-center gap-1.5 rounded-full bg-black/35 px-3.5 py-2.5 font-body text-xs text-amber-50 backdrop-blur-md active:scale-95"
            aria-label="Back to the pages"
          >
            <ArrowLeft size={15} /> pages
          </button>
        ) : (
          <Link
            href="/world"
            onClick={() => sfx.tap()}
            className="flex items-center gap-1.5 rounded-full bg-black/35 px-3.5 py-2.5 font-body text-xs text-amber-50 backdrop-blur-md active:scale-95"
            aria-label="Back home"
          >
            <ArrowLeft size={15} /> home
          </Link>
        )}
        <button
          onClick={() => {
            sfx.tap();
            setInfoOpen(true);
          }}
          className="rounded-full bg-black/35 px-3 py-2.5 font-display text-sm italic text-amber-50/80 backdrop-blur-md active:scale-95"
          aria-label="About these pages"
        >
          ⓘ
        </button>
      </header>

      <div className="relative z-10 mx-auto mt-4 w-full max-w-md px-5">
        {/* intro */}
        {intro === true && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="py-10 text-center">
            <p className="font-body text-[11px] uppercase tracking-[0.35em] text-amber-100/60">things i left along the way</p>
            <div className="mt-6 space-y-4 font-display text-xl italic leading-relaxed text-white/85">
              <p>I left a few things here for you.</p>
              <p>You won&apos;t find everything at once.</p>
              <p>Read each page when you find it.</p>
              <p>Some things are better discovered slowly.</p>
            </div>
            <button onClick={beginIntro} className="mt-8 rounded-full bg-amber-100 px-8 py-3.5 font-body text-sm font-semibold text-stone-900 shadow-glow active:scale-95">
              Begin
            </button>
          </motion.div>
        )}

        {/* shelf of pages */}
        {intro === false && phase === "shelf" && (
          <div className="py-6">
            <p className="text-center font-body text-[11px] uppercase tracking-[0.35em] text-amber-100/60">things i left along the way</p>
            <h1 className="mt-2 text-center font-display text-3xl italic text-amber-50">
              {keptCount === POEMS.length ? "every page kept" : `${keptCount} of ${POEMS.length} pages kept`}
            </h1>
            {keptMsg && <p className="mt-2 text-center font-body text-sm text-white/60">A little piece of that page stayed behind.</p>}
            <div className="mt-6 space-y-3">
              {POEMS.map((p, i) => {
                const pg = lib.pages[p.id];
                const kept = !!pg?.keptAt;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectPoem(p.id)}
                    className="group flex w-full items-center gap-4 rounded-[24px] border border-white/12 bg-white/[0.04] px-5 py-4 text-left backdrop-blur-md transition active:scale-[0.99]"
                    aria-label={`${p.title} — ${kept ? "kept, tap to reopen" : pg?.discoveredAt ? "half-read, tap to continue" : "waiting to be found"}`}
                  >
                    {kept ? (
                      <span className="relative block h-14 w-14 shrink-0 rounded-[3px] px-2 pb-1 pt-4 shadow" style={{ background: p.theme.paperWarm, transform: "rotate(-4deg)" }} aria-hidden>
                        <span className="absolute -top-1.5 left-1/2 block h-3.5 w-3.5 -translate-x-1/2 rounded-full" style={{ background: p.theme.accent }} />
                        <span className="block font-body text-[8px] uppercase tracking-[0.2em] text-stone-500">pg 0{i + 1}</span>
                        <span className="mt-0.5 block truncate font-display text-[11px] italic leading-tight text-stone-800">{p.title}</span>
                      </span>
                    ) : (
                      <span className="paper-texture relative block h-14 w-11 shrink-0 rounded-[3px] bg-[#f5ecdd] shadow" style={{ transform: "rotate(3deg)" }} aria-hidden>
                        <span className="absolute inset-x-2 top-3 space-y-1" aria-hidden>
                          <span className="block h-px bg-stone-800/25" />
                          <span className="block h-px bg-stone-800/25" />
                          <span className="block h-px bg-stone-800/25" />
                        </span>
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-xl italic text-amber-50">{p.title}</span>
                      <span className="mt-0.5 block font-body text-xs text-white/55">
                        {kept ? "kept · tap to reopen ✦" : pg?.discoveredAt ? "a page lies open, half-read" : "a page waiting to be found"}
                      </span>
                    </span>
                    <span className="shrink-0 font-body text-lg text-amber-200 transition-transform group-hover:translate-x-0.5">→</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* waiting / opening */}
        {intro === false && poem && (phase === "waiting" || phase === "opening") && (
          <div className="py-8">
            <motion.div animate={motionOK ? { y: [0, -7, 0] } : {}} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
              {paper(poem, false)}
            </motion.div>
            <p className="mt-6 text-center font-display text-xl italic text-amber-50/90">A page waiting to be found</p>
            {phase === "waiting" ? (
              <button onClick={openPaper} className="mx-auto mt-4 block rounded-full bg-amber-100 px-8 py-3.5 font-body text-sm font-semibold text-stone-900 shadow-glow active:scale-95">
                Open
              </button>
            ) : (
              <p className="mt-4 text-center font-body text-xs text-white/45">unfolding…</p>
            )}
          </div>
        )}

        {/* reading */}
        {intro === false && poem && (phase === "reading" || phase === "star" || phase === "after") && (
          <div className="py-6">
            {paper(poem, true)}
            <AnimatePresence>
              {phase === "reading" && stage >= 7 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 animate-pulse text-center font-display text-sm italic text-white/60"
                >
                  something stirs on the page…
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}

        {phase === "after" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="pb-4">
            <button onClick={keepPage} className="w-full rounded-2xl bg-amber-100 px-4 py-3.5 font-body text-sm font-semibold text-stone-900 shadow-glow active:scale-95">
              Keep this page
            </button>
            <button onClick={readAgain} className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 font-body text-sm text-amber-50 active:scale-95">
              Read again
            </button>
          </motion.div>
        )}

        {phase === "leaving" && poem && <div className="py-6">{paper(poem, true)}</div>}

        {/* kept re-reading */}
        {phase === "kept-reading" && poem && (
          <div className="py-6">
            {paper(poem, true)}
            <button
              onClick={() => {
                setActiveId(null);
                setPhase("shelf");
                refresh();
                window.scrollTo({ top: 0, behavior: "auto" });
              }}
              className="mt-4 w-full rounded-2xl bg-white/10 px-4 py-3 font-body text-sm text-amber-50 active:scale-95"
            >
              ← back to the pages
            </button>
          </div>
        )}
      </div>

      {/* info panel */}
      <AnimatePresence>
        {infoOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:items-center" onClick={() => setInfoOpen(false)}>
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-[#141126] p-6 shadow-soft"
              role="dialog"
              aria-label="About these pages"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl italic text-amber-50">About these pages</h2>
                <button onClick={() => setInfoOpen(false)} aria-label="Close" className="rounded-full bg-white/10 p-2 text-amber-50">
                  <X size={15} />
                </button>
              </div>
              <div className="mt-3 space-y-3 font-body text-sm leading-relaxed text-white/70">
                <p>These are little pieces of writing left here for you.</p>
                <p>You won&apos;t find everything at once.</p>
                <p>Some pages may change as you read them.</p>
                <p>Keep the ones you want to come back to.</p>
                <p>There is no rush.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* localhost dev controls */}
      {dev && (
        <div className="fixed bottom-3 left-3 z-50 rounded-2xl border border-white/15 bg-black/80 p-3 font-body text-[11px] text-white/70">
          <p className="mb-2 uppercase tracking-widest text-white/40">dev · localhost only</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => { resetPoetryAll(); window.location.reload(); }} className="rounded-lg bg-white/10 px-2.5 py-1.5">reset all ↻</button>
            <button onClick={() => setIntro(true)} className="rounded-lg bg-white/10 px-2.5 py-1.5">replay intro</button>
            {poem && (
              <>
                <button onClick={() => { resetPoem(poem.id); refresh(); setStage(1); setPhase("waiting"); window.scrollTo({ top: 0 }); }} className="rounded-lg bg-white/10 px-2.5 py-1.5">replay opening</button>
                <button onClick={() => { resetPoem(poem.id); refresh(); setStage(1); setPhase("waiting"); }} className="rounded-lg bg-white/10 px-2.5 py-1.5">mark undiscovered</button>
                <button onClick={skipToFinal} className="rounded-lg bg-white/10 px-2.5 py-1.5">skip to final ★</button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function PoetryPage() {
  return (
    <Suspense>
      <PoetryView />
    </Suspense>
  );
}
