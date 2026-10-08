"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useStars } from "@/lib/star-store";
import { sfx } from "@/lib/audio";
import { BackdropStars, Nebula } from "@/components/sky/decor";

export default function AlbumPage() {
  const { resolved, discoveredCount, progress } = useStars();
  const kept = resolved.filter((r) => r.discoveredAt);

  return (
    <main
      className="relative min-h-[100dvh] pb-[max(2rem,env(safe-area-inset-bottom))]"
      style={{ background: "linear-gradient(180deg, #04061a 0%, #0a1030 50%, #18224d 100%)" }}
    >
      <div className="absolute inset-0" aria-hidden>
        <Nebula />
        <BackdropStars motion={false} />
      </div>
      <div className="relative mx-auto max-w-md px-5 pt-[max(0.9rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <Link
            href="/world"
            onClick={() => sfx.tap()}
            className="flex items-center gap-1.5 rounded-full bg-black/35 px-3.5 py-2.5 font-body text-xs text-amber-50 backdrop-blur-md active:scale-95"
            aria-label="Back home"
          >
            <ArrowLeft size={15} /> home
          </Link>
          <div className="rounded-full bg-black/35 px-4 py-2.5 font-body text-xs text-amber-100 backdrop-blur-md">
            ✦ {discoveredCount} kept
          </div>
        </div>

        <h1 className="mt-5 text-center font-display text-3xl italic text-amber-50">star album</h1>
        <p className="mt-1 text-center font-body text-xs text-white/55">souvenirs, not obligations</p>

        <div className="mt-5 space-y-3">
          {progress.map((p) => {
            const done = p.complete;
            const forming = p.discoveredCount > 0 && !done;
            if (!done && !forming) return null;
            return (
              <div key={p.constellation.id} className={`rounded-3xl border p-5 text-center ${done ? "border-amber-200/50 bg-amber-100/10 shadow-glow" : "border-white/10 bg-white/[0.05]"}`}>
                <div className="text-2xl">{done ? "✨" : "✦"}</div>
                <div className="mt-1 font-display text-xl italic text-amber-50">
                  {done ? p.constellation.name : "something is forming…"}
                </div>
                <div className="mt-2 font-body text-xs tracking-[0.2em] text-white/55" aria-hidden>
                  {"✦".repeat(p.discoveredCount)}{"·".repeat(Math.max(0, p.total - p.discoveredCount))}
                </div>
                {done && p.constellation.description && (
                  <p className="mx-auto mt-2 max-w-xs font-body text-[13px] leading-relaxed text-white/65">{p.constellation.description}</p>
                )}
                {done && p.constellation.after && (() => {
                  const idx = progress.findIndex((q) => q.constellation.id === p.constellation.id);
                  const next = progress[idx + 1];
                  if (!next || next.complete) return null;
                  return <p className="mx-auto mt-2 max-w-xs font-body text-xs italic leading-relaxed text-amber-200/70">Elsewhere in the sky — {p.constellation.after}</p>;
                })()}
              </div>
            );
          })}
        </div>

        <h2 className="mt-6 font-body text-[11px] uppercase tracking-[0.3em] text-amber-100/60">kept lights</h2>
        <div className="mt-3 space-y-2">
          {kept.length === 0 && (
            <p className="rounded-2xl bg-white/[0.05] p-4 text-center font-body text-xs text-white/45">No stars kept yet. They are waiting up there.</p>
          )}
          {kept.map((r) => (
            <div key={r.star.id} className="rounded-2xl bg-white/[0.06] px-4 py-3 backdrop-blur-md">
              <span className="font-body text-[10px] uppercase tracking-wider text-amber-200/70">{r.label}</span>
              <span className="mt-0.5 block font-display text-[16px] italic text-amber-50">{r.star.title ?? "a quiet star"}</span>
              {r.discoveredAt && (
                <span className="mt-0.5 block font-body text-[11px] text-white/40">
                  found {new Date(r.discoveredAt).toLocaleDateString(undefined, { month: "long", day: "numeric" })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
