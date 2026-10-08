"use client";
import Link from "next/link";
import { useState } from "react";
import { ALL_STARS, CONSTELLATIONS, STARS, STAR_SCHEDULE } from "@/data/stars";
import { validateSky } from "@/services/constellation-service";
import type { Constellation } from "@/types/stars";

/**
 * Constellation gallery — the standardized test view.
 * Every constellation gets the exact same card: art, story, stats,
 * messages in unlock order, coordinates, and a replayable reveal.
 * Not linked from the UI.
 */
function fit(starIds: string[]) {
  const pts = starIds.map((id) => ALL_STARS.find((s) => s.id === id)!).filter(Boolean);
  const xs = pts.map((p) => p.position.x);
  const ys = pts.map((p) => p.position.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const s = Math.min(88 / Math.max(1, x1 - x0), 88 / Math.max(1, y1 - y0));
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return {
    pts,
    nx: (x: number) => 50 + (x - cx) * s,
    ny: (y: number) => 50 + (y - cy) * s,
  };
}

function orderOf(c: Constellation) {
  return [...c.starIds].sort(
    (a, b) => STARS.findIndex((s) => s.id === a) - STARS.findIndex((s) => s.id === b)
  );
}

function GalleryCard({ c, index }: { c: Constellation; index: number }) {
  const [replay, setReplay] = useState(0);
  const { pts, nx, ny } = fit(c.starIds);
  const ordered = orderOf(c);
  const dates = pts.map((p) => p.unlockDate).sort();
  const sizes = pts.filter((p) => p.size).length;

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]" aria-label={c.name}>
      {/* 1 · art */}
      <div className="border-b border-white/5 bg-black/30 px-5 pb-5 pt-4">
        <p className="font-body text-[11px] uppercase tracking-[0.3em] text-amber-100/50">chapter {index + 1}</p>
        <svg key={replay} viewBox="0 0 100 100" className="mx-auto mt-2 aspect-square w-full max-w-[300px]" role="img" aria-label={`${c.name} shape`}>
          {c.connections.map(([a, b], li) => {
            const pa = ALL_STARS.find((s) => s.id === a)!;
            const pb = ALL_STARS.find((s) => s.id === b)!;
            return (
              <line
                key={`${a}-${b}`}
                x1={nx(pa.position.x)}
                y1={ny(pa.position.y)}
                x2={nx(pb.position.x)}
                y2={ny(pb.position.y)}
                stroke="rgba(255,233,168,.75)"
                strokeWidth={0.9}
                strokeLinecap="round"
                strokeDasharray={replay > 0 ? 120 : undefined}
                strokeDashoffset={replay > 0 ? 120 : undefined}
                style={replay > 0 ? { animation: `lab-draw 1s ease ${li * 0.3}s forwards` } : undefined}
              />
            );
          })}
          {pts.map((p) => (
            <g key={p.id}>
              <circle
                cx={nx(p.position.x)}
                cy={ny(p.position.y)}
                r={p.size === "large" ? 3.4 : p.size === "small" ? 1.4 : 2.2}
                fill={p.size ? "#ffcf6e" : "#fff3cf"}
              />
              <text x={nx(p.position.x) + 3} y={ny(p.position.y) - 2.5} fontSize={4.5} fill="rgba(255,255,255,.6)">
                {STARS.findIndex((s) => s.id === p.id) + 1}
              </text>
            </g>
          ))}
        </svg>
        <style>{`@keyframes lab-draw { to { stroke-dashoffset: 0; } }`}</style>
        <button
          onClick={() => setReplay((r) => r + 1)}
          className="mx-auto mt-2 block rounded-full bg-white/10 px-5 py-2 font-body text-xs text-amber-100 active:scale-95"
        >
          ↻ replay reveal
        </button>
      </div>

      {/* 2 · story */}
      <div className="px-5 py-4 text-center">
        <h2 className="font-display text-2xl italic text-amber-50">{c.name}</h2>
        {c.description && <p className="mx-auto mt-1 max-w-sm font-body text-[13px] leading-relaxed text-white/65">{c.description}</p>}
        {c.after && <p className="mx-auto mt-2 max-w-sm font-body text-xs italic leading-relaxed text-amber-200/70">→ {c.after}</p>}
      </div>

      {/* 3 · stats (same grid for every chapter) */}
      <dl className="grid grid-cols-4 gap-px bg-white/5 font-body text-center">
        {[
          { k: "stars", v: String(c.starIds.length) },
          { k: "lines", v: String(c.connections.length) },
          { k: "unlocks", v: `${dates[0]?.slice(5)} → ${dates[dates.length - 1]?.slice(5)}` },
          { k: "detail ★", v: String(sizes) },
        ].map((s) => (
          <div key={s.k} className="bg-[#0b1028] px-2 py-3">
            <dt className="text-[10px] uppercase tracking-wider text-white/40">{s.k}</dt>
            <dd className="mt-0.5 text-sm text-amber-100">{s.v}</dd>
          </div>
        ))}
      </dl>

      {/* 4 · messages in unlock order */}
      <ol className="space-y-1.5 px-5 py-4">
        {ordered.map((id) => {
          const s = ALL_STARS.find((x) => x.id === id)!;
          return (
            <li key={id} className="flex gap-3 rounded-xl bg-white/[0.04] px-3.5 py-2.5">
              <span className="shrink-0 font-body text-[11px] text-amber-200/70">STAR {String(STARS.findIndex((x) => x.id === id) + 1).padStart(2, "0")}</span>
              <span className="font-body text-[13px] leading-snug text-white/75">“{s.message}”</span>
            </li>
          );
        })}
      </ol>

      {/* 5 · coordinates */}
      <details className="border-t border-white/5 px-5 py-3">
        <summary className="cursor-pointer font-body text-xs text-white/45">coordinates · {c.id}</summary>
        <div className="mt-2 overflow-x-auto pb-2">
          <table className="w-full font-body text-[11px] text-white/60">
            <thead>
              <tr className="text-left text-white/40">
                <th className="py-1 pr-3">id</th>
                <th className="py-1 pr-3">x</th>
                <th className="py-1 pr-3">y</th>
                <th className="py-1 pr-3">size</th>
                <th className="py-1">title</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((id) => {
                const p = ALL_STARS.find((x) => x.id === id)!;
                return (
                  <tr key={id} className="border-t border-white/5">
                    <td className="py-1 pr-3 text-amber-100/80">{p.id}</td>
                    <td className="py-1 pr-3">{p.position.x}</td>
                    <td className="py-1 pr-3">{p.position.y}</td>
                    <td className="py-1 pr-3">{p.size ?? "—"}</td>
                    <td className="py-1">{p.title}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export default function ShapeLab() {
  const issues = validateSky(ALL_STARS, CONSTELLATIONS);
  const totalLines = CONSTELLATIONS.reduce((n, c) => n + c.connections.length, 0);

  return (
    <main className="min-h-[100dvh] bg-[#070b1a] px-5 py-8 text-amber-50">
      <div className="mx-auto max-w-2xl">
        <Link href="/sky" className="font-body text-xs text-white/50">← back to the sky</Link>
        <h1 className="mt-2 font-display text-3xl italic">constellation gallery</h1>
        <p className="mt-1 font-body text-xs text-white/55">test view · every chapter, same card, same order</p>

        <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/5 text-center font-body">
          {[
            { k: "chapters", v: String(CONSTELLATIONS.length) },
            { k: "stars", v: String(STARS.length) },
            { k: "lines", v: String(totalLines) },
          ].map((s) => (
            <div key={s.k} className="bg-[#0b1028] px-2 py-3">
              <div className="text-[10px] uppercase tracking-wider text-white/40">{s.k}</div>
              <div className="mt-0.5 text-lg text-amber-100">{s.v}</div>
            </div>
          ))}
        </div>

        <div className={`mt-4 rounded-2xl border p-4 font-body text-xs ${issues.length === 0 ? "border-emerald-300/30 bg-emerald-300/5 text-emerald-100" : "border-red-300/30 bg-red-300/5 text-red-100"}`}>
          {issues.length === 0 ? (
            <>✓ all shapes valid — every line lands, no tap overlaps</>
          ) : (
            <ul className="list-disc space-y-1 pl-4">
              {issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
        </div>

        {CONSTELLATIONS.map((c, i) => (
          <GalleryCard key={c.id} c={c} index={i} />
        ))}
      </div>
    </main>
  );
}
