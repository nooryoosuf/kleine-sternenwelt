"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Info, Layers, Volume2, VolumeX } from "lucide-react";
import { useStars } from "@/lib/star-store";
import { usePrefs } from "@/lib/prefs";
import { moodOrDefault } from "@/lib/moods";
import Link from "next/link";
import { sfx, startAmbient } from "@/lib/audio";
import { BackdropStars, Dust, Nebula, Rain, ShootingStars } from "@/components/sky/decor";
import { ALL_STARS, CONSTELLATIONS, SECRET_STAR, STARS, STAR_SCHEDULE } from "@/data/stars";
import { constellationProgress } from "@/services/constellation-service";
import { resolveStars, type ResolvedStar } from "@/services/star-service";

function usePrefersReduced() {
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

function SkyView() {
  const store = useStars();
  const search = useSearchParams();
  // test preview (?preview=full): the finished sky, read-only — nothing is written
  const previewFull = search.get("preview") === "full";
  const sim = useMemo(() => {
    if (!previewFull) return null;
    const everything: Record<string, string> = {};
    for (const s of ALL_STARS) everything[s.id] = new Date().toISOString();
    return {
      resolved: resolveStars(STARS, [SECRET_STAR], everything, true, store.today, STAR_SCHEDULE),
      progress: constellationProgress(CONSTELLATIONS, everything),
    };
  }, [previewFull, store.today]);
  const { pendingReveal, dismissReveal, discover, tapMoon, markVisited, introSeen, markIntroSeen } = store;
  const resolved = sim?.resolved ?? store.resolved;
  const progress = sim?.progress ?? store.progress;
  const availableCount = previewFull ? 0 : store.availableCount;
  const discoveredCount = previewFull ? ALL_STARS.length : store.discoveredCount;
  const catchUpCount = previewFull ? 0 : store.catchUpCount;
  const { mood } = usePrefs();
  const mm = moodOrDefault(mood);
  const prefersReduced = usePrefersReduced();
  const motionOK = !prefersReduced;

  const [focusId, setFocusId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busyGone, setBusyGone] = useState(false);
  const [muted, setMuted] = useState(false);
  const [par, setPar] = useState({ x: 0, y: 0 });
  const discoveredRef = useRef<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      setMuted(localStorage.getItem("ksw-mute") === "1");
    } catch {}
  }, []);

  const say = useCallback((t: string) => {
    setToast(t);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const dismissBusy = useCallback(() => {
    setBusyGone(true);
    markVisited();
  }, [markVisited]);

  // focus transition: dim the sky, then reveal the card
  useEffect(() => {
    if (!focusId) {
      setSheetOpen(false);
      return;
    }
    if (!motionOK) {
      setSheetOpen(true);
      return;
    }
    const t = window.setTimeout(() => setSheetOpen(true), 620);
    return () => window.clearTimeout(t);
  }, [focusId, motionOK]);

  // a star is "kept" the moment its message is revealed — exactly once (never in preview)
  useEffect(() => {
    if (!previewFull && sheetOpen && focusId && discoveredRef.current !== focusId) {
      const r = resolved.find((x) => x.star.id === focusId);
      if (r && r.state === "available") {
        discoveredRef.current = focusId;
        discover(focusId);
        sfx.discover();
        dismissBusy();
      }
    }
  }, [previewFull, sheetOpen, focusId, resolved, discover, dismissBusy]);

  const focusStar: ResolvedStar | undefined = focusId ? resolved.find((r) => r.star.id === focusId) : undefined;

  const posOf = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const r of resolved) m.set(r.star.id, r.star.position);
    return m;
  }, [resolved]);

  const { litLines, connectedIds, completeIds } = useMemo(() => {
    const lines: { a: string; b: string; complete: boolean }[] = [];
    const conn = new Set<string>();
    const done = new Set<string>();
    for (const p of progress) {
      if (p.complete) {
        done.add(p.constellation.id);
        for (const id of p.constellation.starIds) conn.add(id);
      }
      for (const [a, b] of p.litConnections) {
        lines.push({ a, b, complete: p.complete });
        conn.add(a);
        conn.add(b);
      }
    }
    return { litLines: lines, connectedIds: conn, completeIds: done };
  }, [progress]);

  const onStarTap = (r: ResolvedStar) => {
    startAmbient("peaceful");
    if (r.state === "sleeping") {
      sfx.soft();
      say("This star is still sleeping.");
      return;
    }
    if (r.state === "hidden") return;
    sfx.open();
    setCollectionOpen(false);
    setFocusId(r.star.id);
  };

  const closeFocus = () => {
    sfx.tap();
    setFocusId(null);
  };

  const onMoonTap = () => {
    sfx.tap();
    if (previewFull) return;
    const woke = tapMoon();
    if (woke) {
      sfx.discover();
      say("Something woke up near the moon…");
    }
  };

  const onMouse = (e: React.MouseEvent) => {
    if (!motionOK) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 8;
    setPar({ x, y });
  };

  // measured stage — 100 design units always equal the smaller screen edge,
  // so every constellation keeps its true proportions on phone and desktop
  const stageRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState(() =>
    typeof window !== "undefined" ? { w: window.innerWidth, h: window.innerHeight } : { w: 390, h: 700 }
  );
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setBox({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const SU = Math.min(box.w, box.h) / 100;
  const SOX = (box.w - 100 * SU) / 2;
  const SOY = (box.h - 100 * SU) / 2;
  const PX = (x: number) => SOX + x * SU;
  const PY = (y: number) => SOY + y * SU;

  const showBusy = catchUpCount >= 2 && !busyGone && !focusId && introSeen;
  const showReveal = pendingReveal !== null && focusId === null && !collectionOpen;

  // cinematic zoom: fly to the finished constellation, then glide back out
  const [zoomCId, setZoomCId] = useState<string | null>(null);
  const [zoomOut, setZoomOut] = useState(false);
  const [closer, setCloser] = useState(false);
  useEffect(() => {
    if (pendingReveal && !zoomCId) {
      setZoomCId(pendingReveal.id);
      setCloser(false);
      setZoomOut(false);
    }
  }, [pendingReveal, zoomCId]);

  const zoomConst = zoomCId ? CONSTELLATIONS.find((c) => c.id === zoomCId) : undefined;
  // top-down draw order, like the shape descending into view
  const zoomOrder: Record<string, number> = {};
  if (zoomConst) {
    [...zoomConst.connections]
      .sort((pa, pb) => {
        const ya = ((posOf.get(pa[0])?.y ?? 0) + (posOf.get(pa[1])?.y ?? 0)) / 2;
        const yb = ((posOf.get(pb[0])?.y ?? 0) + (posOf.get(pb[1])?.y ?? 0)) / 2;
        return ya - yb || (posOf.get(pa[0])?.x ?? 0) - (posOf.get(pb[0])?.x ?? 0);
      })
      .forEach(([a, b], i) => {
        zoomOrder[`${a}>${b}`] = i;
      });
  }
  // camera framing for the zoomed shape
  let camTx = 0;
  let camTy = 0;
  let camK = 1;
  if (zoomConst && box.w > 1) {
    const zps = zoomConst.starIds.map((id) => posOf.get(id)).filter((p): p is { x: number; y: number } => !!p);
    if (zps.length > 0) {
      const zbx = zps.map((p) => PX(p.x));
      const zby = zps.map((p) => PY(p.y));
      const zbw = Math.max(1, Math.max(...zbx) - Math.min(...zbx));
      const zbh = Math.max(1, Math.max(...zby) - Math.min(...zby));
      const k = Math.min(3, (0.66 * Math.min(box.w, box.h)) / Math.max(zbw, zbh));
      const kk = zoomOut ? 1 : k;
      const ccx = (Math.min(...zbx) + Math.max(...zbx)) / 2;
      const ccy = (Math.min(...zby) + Math.max(...zby)) / 2;
      camTx = box.w / 2 - ccx * kk;
      camTy = box.h * 0.4 - ccy * kk;
      camK = kk;
    }
  }
  const camActive = camK !== 1 || zoomOut;

  const finishReveal = () => {
    sfx.tap();
    setZoomOut(true);
    window.setTimeout(() => {
      dismissReveal();
      setZoomCId(null);
      setZoomOut(false);
      setCloser(false);
    }, 1100);
  };

  const showZoomSheets = showReveal && pendingReveal !== null && !zoomOut;

  // waking regions — a zone stays dark until first touched, then glows with progress
  const zones = progress
    .filter((p) => p.discoveredCount > 0)
    .map((p) => {
      const pts = p.constellation.starIds
        .map((id) => posOf.get(id))
        .filter((pt): pt is { x: number; y: number } => !!pt);
      if (pts.length === 0) return null;
      const pad = 13;
      const zx0 = PX(Math.max(0, Math.min(...pts.map((q) => q.x)) - pad));
      const zx1 = PX(Math.min(100, Math.max(...pts.map((q) => q.x)) + pad));
      const zy0 = PY(Math.max(0, Math.min(...pts.map((q) => q.y)) - pad));
      const zy1 = PY(Math.min(100, Math.max(...pts.map((q) => q.y)) + pad));
      return {
        id: p.constellation.id,
        left: zx0,
        top: zy0,
        width: Math.max(1, zx1 - zx0),
        height: Math.max(1, zy1 - zy0),
        opacity: 0.05 + 0.13 * (p.discoveredCount / Math.max(1, p.total)),
      };
    })
    .filter((z): z is NonNullable<typeof z> => z !== null);

  // moon journey — the moon waxes with the whole sky, full at completion
  const skyTotal = progress.reduce((n, p) => n + p.total, 0);
  const moonPhase = skyTotal > 0 ? Math.min(1, discoveredCount / skyTotal) : 0;

  return (
    <main
      className="relative h-[100dvh] overflow-hidden text-amber-50"
      style={{ background: `linear-gradient(180deg, ${mm.sky[0]} 0%, ${mm.sky[1]} 48%, ${mm.sky[2]} 100%)`, transition: "background 1.2s ease" }}
      onMouseMove={onMouse}
      aria-label="Your night sky"
    >
      {/* parallax layers */}
      <div className="absolute inset-0 transition-transform duration-700 ease-out" style={{ transform: `translate(${par.x * 0.4}px, ${par.y * 0.3}px)` }}>
        <Nebula />
        {/* mood tint */}
        <div className="absolute inset-0" style={{ background: `radial-gradient(80% 50% at 50% 0%, ${mm.palette.glow}, transparent 70%)`, transition: "background 1.2s ease" }} aria-hidden />
        <BackdropStars motion={motionOK} count={Math.round(mm.particleCount * 1.25)} />
      </div>
      <div ref={stageRef} className="absolute inset-0" style={{ transform: `translate(${par.x + camTx}px, ${par.y + camTy}px) scale(${(focusId ? 1.045 : 1) * camK})`, transition: camActive ? "transform 1.5s cubic-bezier(.22,.8,.24,1)" : "transform 0.7s ease-out" }}>
        <ShootingStars motion={motionOK} />
        <Dust motion={motionOK} />
        {mm.particle === "rain" && <Rain motion={motionOK} />}
        <style>{`@keyframes const-draw { to { stroke-dashoffset: 0; } }`}</style>

        {/* waking regions */}
        {zones.map((z) => (
          <div
            key={z.id}
            className="pointer-events-none absolute rounded-[50%]"
            style={{
              left: z.left,
              top: z.top,
              width: z.width,
              height: z.height,
              background: `radial-gradient(closest-side, ${mm.palette.glow}, transparent 72%)`,
              opacity: z.opacity,
              transition: "opacity 1.5s ease",
            }}
            aria-hidden
          />
        ))}

        {/* constellation lines — same pixel space as the stars, never stretched */}
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${box.w} ${box.h}`} aria-hidden>
          {litLines.map(({ a, b, complete }) => {
            const pa = posOf.get(a);
            const pb = posOf.get(b);
            if (!pa || !pb) return null;
            const zi = zoomCId && !zoomOut ? zoomOrder[`${a}>${b}`] : undefined;
            const redrawing = zi !== undefined && motionOK;
            return (
              <line
                key={`${a}-${b}`}
                x1={PX(pa.x)}
                y1={PY(pa.y)}
                x2={PX(pb.x)}
                y2={PY(pb.y)}
                stroke={mm.palette.accent}
                strokeOpacity={complete ? 0.9 : 0.38}
                strokeWidth={complete ? 1.4 : 1}
                strokeLinecap="round"
                strokeDasharray={redrawing ? 400 : undefined}
                strokeDashoffset={redrawing ? 400 : undefined}
                style={
                  redrawing
                    ? { animation: `const-draw 1s ease ${(zi as number) * 0.3}s forwards`, filter: `drop-shadow(0 0 3px ${mm.palette.glow})` }
                    : complete
                      ? { filter: `drop-shadow(0 0 3px ${mm.palette.glow})` }
                      : undefined
                }
              />
            );
          })}
        </svg>

        {/* the moon — tap 3× for a secret */}
        <button
          onClick={onMoonTap}
          className="absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-opacity duration-700 active:scale-95"
          style={{ left: PX(74), top: PY(5.5), opacity: zoomCId ? 0.2 : 1 }}
          aria-label={`The moon, ${moonPhase >= 1 ? "whole" : moonPhase >= 0.6 ? "nearly whole" : moonPhase >= 0.25 ? "halfway lit" : "a new sliver"} (it seems to be listening)`}
        >
          <span className="relative block h-9 w-9 overflow-hidden rounded-full bg-[#fdf3d0] shadow-glow" style={{ opacity: 0.92 }}>
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: `linear-gradient(180deg, ${mm.sky[0]}, ${mm.sky[1]})`,
                transform: `translateX(${(0.12 + moonPhase * 0.98) * 100}%)`,
                filter: "blur(1px)",
                transition: "transform 1.2s ease",
              }}
              aria-hidden
            />
          </span>
          <span className="absolute h-14 w-14 rounded-full" style={{ background: `radial-gradient(circle, ${mm.palette.glow}, transparent 65%)`, opacity: 0.4 + moonPhase * 0.6 }} aria-hidden />
        </button>

        {/* collectible stars */}
        {resolved.map((r) => {
          if (r.state === "hidden") return null;
          const { x, y } = r.star.position;
          const focused = focusId === r.star.id;
          const dimmed = focusId !== null && !focused;
          const st = r.state === "discovered" && connectedIds.has(r.star.id) ? "connected" : r.state;
          // artwork scale only — the touch target stays a full 48px
          const sizeMul = r.star.size === "large" ? 1.5 : r.star.size === "small" ? 0.7 : 1;
          const memberBoost = zoomCId !== null && zoomCId === r.star.constellationId ? 1.3 : 1;
          const zoom = (focused ? 1.7 : 1) * sizeMul * memberBoost;
          return (
            <button
              key={r.star.id}
              onClick={() => onStarTap(r)}
              className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-all duration-500 active:scale-90"
              style={{ left: PX(x), top: PY(y), opacity: dimmed || (zoomCId !== null && zoomCId !== r.star.constellationId) ? 0.15 : 1 }}
              aria-label={st === "sleeping" ? "A sleeping star" : st === "available" ? `An undiscovered star, ${r.label}` : `${r.label}${r.star.title ? `, ${r.star.title}` : ""}`}
            >
              {st === "sleeping" && <span className="block h-[3px] w-[3px] rounded-full bg-slate-300/50" />}
              {st === "available" && (
                <span className="relative flex items-center justify-center" style={{ transform: zoom === 1 ? undefined : `scale(${zoom})` }}>
                  <span className={`absolute inline-flex h-7 w-7 rounded-full ${motionOK && !focused ? "animate-ping" : ""}`} style={{ background: mm.palette.glow, animationDuration: "2.6s" }} aria-hidden />
                  {r.star.size === "large" && <span className="absolute inline-flex h-11 w-11 rounded-full" style={{ background: mm.palette.glass }} aria-hidden />}
                  <span className="relative block h-2.5 w-2.5 rounded-full bg-[#fff3cf]" style={{ boxShadow: `0 0 12px 4px ${mm.palette.glow}, 0 0 30px 10px ${mm.palette.glass}` }} aria-hidden />
                  {motionOK && !focused && (
                    <>
                      <span className="absolute -right-1.5 -top-1 h-1 w-1 rounded-full bg-amber-100/90" style={{ animation: "dust-float 3s ease-in-out infinite" }} aria-hidden />
                      <span className="absolute -left-2 top-1.5 h-0.5 w-0.5 rounded-full bg-amber-100/70" style={{ animation: "dust-float 4s ease-in-out infinite" }} aria-hidden />
                    </>
                  )}
                </span>
              )}
              {st === "discovered" && (
                <span className="block h-[7px] w-[7px] rounded-full bg-[#f4ead0]" style={{ boxShadow: "0 0 8px 2px rgba(244,234,208,.5)", transform: zoom === 1 ? undefined : `scale(${zoom})` }} aria-hidden />
              )}
              {st === "connected" && (
                <span className="block h-2 w-2 rounded-full" style={{ background: mm.palette.accent, boxShadow: `0 0 10px 3px ${mm.palette.glow}`, transform: zoom === 1 ? undefined : `scale(${zoom})` }} aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      {/* vignette — deeper for heavy moods */}
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(120% 90% at 50% 30%, transparent 55%, rgba(0,0,0,${0.35 + mm.dim * 0.45}) 100%)` }} aria-hidden />

      {/* minimal header */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-[max(0.9rem,env(safe-area-inset-top))]">
        <Link href="/world" onClick={() => sfx.tap()} className="flex items-center gap-2 rounded-full bg-black/35 px-3.5 py-2.5 backdrop-blur-md active:scale-95" aria-label="Back home">
          <span className="text-sm leading-none">{mm.emoji}</span>
          <span className="font-body text-xs text-amber-50">home</span>
        </Link>
        <div className="rounded-full bg-black/35 px-4 py-2.5 font-body text-xs text-amber-100 backdrop-blur-md" aria-live="polite">
          ✦ {discoveredCount} kept{availableCount > 0 ? ` · ${availableCount} waiting` : ""}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !muted;
              setMuted(next);
              try {
                localStorage.setItem("ksw-mute", next ? "1" : "0");
              } catch {}
              sfx.tap();
            }}
            className="rounded-full bg-black/35 p-2.5 text-amber-50 backdrop-blur-md active:scale-95"
            aria-label={muted ? "Unmute sounds" : "Mute sounds"}
            aria-pressed={muted}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <button onClick={() => { sfx.tap(); setCollectionOpen(true); }} className="rounded-full bg-black/35 p-2.5 text-amber-50 backdrop-blur-md active:scale-95" aria-label="Open star collection">
            <Layers size={15} />
          </button>
          <button onClick={() => { sfx.tap(); setInfoOpen(true); }} className="rounded-full bg-black/35 p-2.5 text-amber-50/80 backdrop-blur-md active:scale-95" aria-label="About this sky">
            <Info size={15} />
          </button>
        </div>
      </header>

      {/* full-sky test preview */}
      {previewFull && (
        <div className="absolute inset-x-0 top-[max(4.5rem,calc(env(safe-area-inset-top)+4.5rem))] z-20 flex flex-wrap justify-center gap-2 px-5">
          <Link href="/sky" onClick={() => sfx.tap()} className="rounded-full border border-amber-200/40 bg-black/55 px-4 py-2 font-body text-xs text-amber-100 backdrop-blur-md active:scale-95">
            preview · tap to exit
          </Link>
          <Link href="/preview" onClick={() => sfx.tap()} className="rounded-full bg-amber-200/90 px-4 py-2 font-body text-xs font-semibold text-stone-900 active:scale-95">
            read as journey ↓
          </Link>
        </div>
      )}

      {/* busy-sky banner */}
      <AnimatePresence>
        {showBusy && (
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="absolute inset-x-0 top-[max(4.5rem,calc(env(safe-area-inset-top)+4.5rem))] z-20 flex justify-center px-5">
            <button onClick={() => { sfx.open(); dismissBusy(); }} className="max-w-sm rounded-3xl border border-amber-200/30 bg-[#141a38]/90 px-5 py-3.5 text-center shadow-soft backdrop-blur-md active:scale-95">
              <span className="block font-display text-[15px] italic text-amber-100">The sky has been busy while you were away.</span>
              <span className="mt-0.5 block font-body text-xs text-white/60">{catchUpCount} stars are waiting ✨ — tap to look up</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* first-visit hint */}
      {!focusId && introSeen && discoveredCount === 0 && availableCount > 0 && !showBusy && (
        <p className="absolute inset-x-0 bottom-[max(1.6rem,env(safe-area-inset-bottom))] z-10 text-center font-body text-xs text-white/50">tap a glowing star ✦</p>
      )}

      {/* toast */}
      <AnimatePresence>
        {toast && !sheetOpen && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-x-0 bottom-[max(4rem,calc(env(safe-area-inset-bottom)+4rem))] z-20 flex justify-center px-5">
            <span className="rounded-full bg-black/55 px-4 py-2.5 font-body text-xs text-amber-100 backdrop-blur-md">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* first-time walkthrough — part of the world, not a manual */}
      <AnimatePresence>
        {!introSeen && !previewFull && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 flex items-center justify-center bg-[#04061a]/70 p-6" role="dialog" aria-label="Welcome to the little sky">
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
              className="max-h-[86dvh] w-full max-w-sm overflow-y-auto rounded-[28px] border border-white/12 bg-[#0d1330]/95 p-6 text-center shadow-soft backdrop-blur-md"
            >
              <div className="mx-auto h-2.5 w-2.5 rounded-full bg-[#fff3cf] shadow-glow" aria-hidden />
              <p className="mt-3 font-body text-[11px] uppercase tracking-[0.35em] text-amber-100/70">welcome to the little sky</p>
              <p className="mt-3 font-body text-sm leading-relaxed text-white/75">
                Every day, a little star may find its way here. Discover the stars and keep their little moments close.
              </p>
              <p className="mt-2 font-body text-sm leading-relaxed text-white/75">
                Some stars belong together. Follow them slowly, and you may discover something hidden in the sky.
              </p>
              <ol className="mt-4 space-y-2.5 text-left">
                {[
                  { n: "1", t: "Find a star", d: "Look for a gentle glow." },
                  { n: "2", t: "Discover it", d: "Tap the star to reveal what it holds." },
                  { n: "3", t: "Watch the sky connect", d: "Kept stars begin forming little patterns." },
                  { n: "4", t: "A hidden shape", d: "Eventually, the stars reveal themselves." },
                ].map((s) => (
                  <li key={s.n} className="flex items-start gap-3 rounded-2xl bg-white/[0.05] px-4 py-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200/15 font-body text-xs text-amber-200">{s.n}</span>
                    <span>
                      <span className="block font-body text-[13px] font-semibold text-amber-50">{s.t}</span>
                      <span className="block font-body text-xs text-white/55">{s.d}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <button onClick={() => { sfx.open(); markIntroSeen(); }} className="mt-5 w-full rounded-2xl bg-amber-100 px-4 py-3.5 font-body text-sm font-semibold text-stone-900 shadow-glow active:scale-95">
                Enter the Sky
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* always-available gentle explanation */}
      <AnimatePresence>
        {infoOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 flex items-end justify-center bg-black/55 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:items-center" onClick={() => setInfoOpen(false)}>
            <motion.div
              initial={{ y: 90, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 240 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[72dvh] w-full max-w-sm overflow-y-auto rounded-3xl bg-[#10162f] p-6 shadow-soft"
              role="dialog"
              aria-label="About the little sky"
            >
              <h2 className="text-center font-display text-2xl italic text-amber-50">the little sky</h2>
              <div className="mt-4 space-y-3 text-left">
                {[
                  { t: "Stars", d: "A new little star may appear from time to time. Discover it to see what it holds." },
                  { t: "Discover", d: "Tap a glowing star to open it." },
                  { t: "Connections", d: "Some stars belong together. When the right stars are discovered, they begin connecting." },
                  { t: "Constellations", d: "Follow the stars and you may discover a hidden shape." },
                  { t: "No pressure", d: "There are no streaks and nothing is lost if you are away for a while." },
                ].map((s) => (
                  <div key={s.t} className="rounded-2xl bg-white/[0.05] px-4 py-3">
                    <p className="font-display text-[15px] italic text-amber-100">{s.t}</p>
                    <p className="mt-0.5 font-body text-[13px] leading-relaxed text-white/65">{s.d}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => { sfx.tap(); setInfoOpen(false); }} className="mt-4 w-full rounded-2xl bg-white/10 py-3 font-body text-sm text-amber-50 active:scale-95">back to the sky</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* star reveal */}
      <AnimatePresence>
        {focusStar && sheetOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 flex items-end justify-center bg-black/35 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:items-center" onClick={closeFocus}>
            <motion.div
              initial={{ y: 90, opacity: 0, scale: 0.94 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", damping: 22, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm text-center"
              role="dialog"
              aria-label={focusStar.label}
            >
              <div className="mx-auto mb-3 h-3 w-3 rounded-full" style={{ background: mm.palette.accent, boxShadow: `0 0 12px 4px ${mm.palette.glow}` }} aria-hidden />
              <p className="font-body text-[11px] uppercase tracking-[0.35em] text-amber-100/70">{focusStar.label}</p>
              {focusStar.star.title && <h2 className="mt-1 font-display text-2xl italic text-amber-50">{focusStar.star.title}</h2>}
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: motionOK ? 0.35 : 0 }} className="mt-3 font-display text-[21px] italic leading-relaxed text-white/95">
                “{focusStar.star.message}”
              </motion.p>
              {focusStar.discoveredAt && focusStar.star.type !== "secret" && (
                <p className="mt-3 font-body text-[11px] text-white/45">found {new Date(focusStar.discoveredAt).toLocaleDateString(undefined, { month: "long", day: "numeric" })} · kept forever</p>
              )}
              <button onClick={closeFocus} className="mt-5 w-full rounded-2xl bg-amber-100 px-4 py-3.5 font-body text-sm font-semibold text-stone-900 shadow-glow active:scale-95">
                Keep this star ✦
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* constellation reveal — the real sky flies closer, no popup */}
      <AnimatePresence>
        {showZoomSheets && pendingReveal && (
          <motion.div
            key="zoom-sheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            role="dialog"
            aria-label="Something in the sky became whole"
          >
            {!closer ? (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: motionOK ? 1.6 : 0, duration: 0.8 }}
                className="pointer-events-auto w-full max-w-sm rounded-[26px] border border-white/12 bg-[#0d1330]/92 px-6 py-5 text-center shadow-soft backdrop-blur-md"
              >
                <p className="font-body text-[11px] uppercase tracking-[0.35em] text-amber-100/70">✨ something became whole</p>
                <p className="mx-auto mt-2 max-w-xs font-display text-xl italic leading-relaxed text-white/85">
                  oh… these things were connected all along.
                </p>
                <button onClick={() => { sfx.open(); setCloser(true); }} className="mx-auto mt-5 block rounded-full bg-amber-100 px-8 py-3.5 font-body text-sm font-semibold text-stone-900 shadow-glow active:scale-95">
                  look closer
                </button>
                <button onClick={finishReveal} className="mx-auto mt-1 block px-4 py-2 font-body text-xs text-white/40">
                  not now
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="pointer-events-auto w-full max-w-sm rounded-[26px] border border-white/12 bg-[#0d1330]/92 px-6 py-5 text-center shadow-soft backdrop-blur-md"
              >
                <p className="font-body text-[11px] uppercase tracking-[0.35em] text-amber-100/70">✨ constellation discovered</p>
                <h2 className="mt-2 font-display text-3xl italic text-amber-50">{pendingReveal.name}</h2>
                {pendingReveal.description && <p className="mx-auto mt-2 max-w-xs font-body text-sm leading-relaxed text-white/65">{pendingReveal.description}</p>}
                {pendingReveal.after && <p className="mx-auto mt-3 max-w-xs font-body text-[13px] italic leading-relaxed text-amber-200/75">Elsewhere in the sky — {pendingReveal.after}</p>}
                <button onClick={finishReveal} className="mx-auto mt-5 block rounded-full bg-amber-100 px-8 py-3.5 font-body text-sm font-semibold text-stone-900 shadow-glow active:scale-95">
                  keep looking up
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* collection */}
      <AnimatePresence>
        {collectionOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 flex items-end justify-center bg-black/55 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:items-center" onClick={() => setCollectionOpen(false)}>
            <motion.div
              initial={{ y: 90, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 240 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[70dvh] w-full max-w-sm overflow-y-auto rounded-3xl bg-[#10162f] p-5 shadow-soft"
              role="dialog"
              aria-label="Star collection"
            >
              <h2 className="text-center font-display text-xl italic text-amber-50">kept stars</h2>
              <div className="mt-4 grid grid-cols-7 gap-2">
                {resolved.filter((r) => r.star.type !== "secret").map((r) => (
                  <button
                    key={r.star.id}
                    disabled={r.state === "sleeping"}
                    onClick={() => r.state !== "sleeping" && onStarTap(r)}
                    className="flex aspect-square flex-col items-center justify-center rounded-xl bg-white/[0.05] font-body text-[9px] text-white/60 active:scale-90 disabled:opacity-40"
                    aria-label={r.label}
                  >
                    <span className={`text-base ${r.state === "available" ? "animate-pulse text-amber-200" : r.state !== "sleeping" ? "text-amber-200" : "text-white/25"}`}>
                      {r.state === "sleeping" ? "·" : r.state === "available" ? "✧" : "✦"}
                    </span>
                    {r.label.replace("STAR ", "")}
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {progress.filter((p) => p.discoveredCount > 0 || p.complete).map((p) => {
                  const named = completeIds.has(p.constellation.id);
                  return (
                    <div key={p.constellation.id} className="rounded-2xl bg-white/[0.05] px-4 py-3 font-body text-xs text-white/70">
                      {named ? (
                        <><span className="font-display text-sm italic text-amber-100">✨ {p.constellation.name}</span><span className="text-white/50"> — found</span></>
                      ) : (
                        <>{"✦".repeat(Math.min(p.discoveredCount, 6))}{"·".repeat(Math.max(0, Math.min(6, p.total) - Math.min(p.discoveredCount, 6)))} <span className="text-white/50">something is forming…</span></>
                      )}
                    </div>
                  );
                })}
                {discoveredCount === 0 && <p className="rounded-2xl bg-white/[0.05] px-4 py-3 text-center font-body text-xs text-white/45">No stars kept yet. They are waiting up there.</p>}
              </div>
              <button onClick={() => setCollectionOpen(false)} className="mt-4 w-full rounded-2xl bg-white/10 py-3 font-body text-sm text-amber-50 active:scale-95">back to the sky</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function SkyPage() {
  return (
    <Suspense>
      <SkyView />
    </Suspense>
  );
}
