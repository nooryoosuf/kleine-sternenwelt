"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePrefs } from "@/lib/prefs";
import { moodOrDefault } from "@/lib/moods";
import { ALL_STARS, CONSTELLATIONS, STARS } from "@/data/stars";
import { sfx } from "@/lib/audio";
import { BackdropStars, Nebula } from "@/components/sky/decor";
import type { Star } from "@/types/stars";

/** same uniform-fit math as the sky — shapes never stretch */
function useFit(starIds: string[]) {
  const pts = starIds.map((id) => ALL_STARS.find((s) => s.id === id)!).filter(Boolean);
  const xs = pts.map((p) => p.position.x);
  const ys = pts.map((p) => p.position.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const s = Math.min(82 / Math.max(1, x1 - x0), 82 / Math.max(1, y1 - y0));
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return { pts, nx: (x: number) => 50 + (x - cx) * s, ny: (y: number) => 50 + (y - cy) * s };
}

function Chapter({ index, total }: { index: number; total: number }) {
  const c = CONSTELLATIONS[index];
  const { mood } = usePrefs();
  const mm = moodOrDefault(mood);
  const { pts, nx, ny } = useFit(c.starIds);
  const ordered = [...c.starIds].sort(
    (a, b) => STARS.findIndex((s) => s.id === a) - STARS.findIndex((s) => s.id === b)
  );
  const byId = new Map<string, Star>(pts.map((p) => [p.id, p]));

  return (
    <section className="flex min-h-[100dvh] snap-start flex-col justify-center px-6 py-16" aria-label={c.name}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20%" }}
        transition={{ duration: 0.8 }}
        className="mx-auto w-full max-w-sm"
      >
        <p className="text-center font-body text-[11px] uppercase tracking-[0.35em] text-amber-100/60">
          chapter {index + 1} of {total}
        </p>
        <div className="relative mt-2">
          <div
            className="absolute inset-0 rounded-[32px]"
            style={{ background: `radial-gradient(closest-side, ${mm.palette.glow}, transparent 75%)`, opacity: 0.5 }}
            aria-hidden
          />
          <svg viewBox="0 0 100 100" className="relative mx-auto aspect-square w-full" role="img" aria-label={`${c.name} finished shape`}>
            {c.connections.map(([a, b]) => {
              const pa = byId.get(a)!;
              const pb = byId.get(b)!;
              return (
                <line
                  key={`${a}-${b}`}
                  x1={nx(pa.position.x)}
                  y1={ny(pa.position.y)}
                  x2={nx(pb.position.x)}
                  y2={ny(pb.position.y)}
                  stroke={mm.palette.accent}
                  strokeOpacity={0.85}
                  strokeWidth={1.1}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 4px ${mm.palette.glow})` }}
                />
              );
            })}
            {pts.map((p) => (
              <circle
                key={p.id}
                cx={nx(p.position.x)}
                cy={ny(p.position.y)}
                r={p.size === "large" ? 3.6 : p.size === "small" ? 1.5 : 2.4}
                fill={mm.palette.accent}
                style={{ filter: `drop-shadow(0 0 6px ${mm.palette.glow})` }}
              />
            ))}
          </svg>
        </div>
        <h2 className="mt-2 text-center font-display text-3xl italic text-amber-50">{c.name}</h2>
        {c.description && <p className="mx-auto mt-2 max-w-xs text-center font-body text-sm leading-relaxed text-white/65">{c.description}</p>}
        {c.after && <p className="mx-auto mt-2 max-w-xs text-center font-body text-[13px] italic leading-relaxed text-amber-200/75">→ {c.after}</p>}
        <div className="mt-5 space-y-1.5">
          {ordered.map((id) => {
            const s = byId.get(id)!;
            return (
              <div key={id} className="flex gap-3 rounded-xl bg-white/[0.05] px-3.5 py-2.5 backdrop-blur-sm">
                <span className="shrink-0 font-body text-[11px] text-amber-200/70">
                  STAR {String(STARS.findIndex((x) => x.id === id) + 1).padStart(2, "0")}
                </span>
                <span className="font-body text-[13px] leading-snug text-white/75">“{s.message}”</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}

export default function PreviewPage() {
  return (
    <main
      className="relative h-[100dvh] snap-y snap-proximity overflow-y-auto"
      style={{ background: "linear-gradient(180deg, #04061a 0%, #0a1030 50%, #18224d 100%)" }}
      aria-label="The whole journey preview"
    >
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <Nebula />
        <BackdropStars motion={false} />
      </div>
      <header className="fixed inset-x-0 top-0 z-20 flex justify-center px-5 pt-[max(0.9rem,env(safe-area-inset-top))]">
        <Link
          href="/sky"
          onClick={() => sfx.tap()}
          className="rounded-full border border-amber-200/40 bg-black/55 px-4 py-2 font-body text-xs text-amber-100 backdrop-blur-md active:scale-95"
        >
          preview · the whole journey — tap to exit
        </Link>
      </header>
      <div className="relative">
        {CONSTELLATIONS.map((c, i) => (
          <Chapter key={c.id} index={i} total={CONSTELLATIONS.length} />
        ))}
        <footer className="flex min-h-[50dvh] snap-start flex-col items-center justify-center px-6 text-center">
          <p className="font-display text-2xl italic text-amber-50">the sky is whole — for now.</p>
          <Link
            href="/sky"
            onClick={() => sfx.open()}
            className="mt-5 rounded-full bg-amber-100 px-8 py-3.5 font-body text-sm font-semibold text-stone-900 shadow-glow active:scale-95"
          >
            back to your sky
          </Link>
        </footer>
      </div>
    </main>
  );
}
