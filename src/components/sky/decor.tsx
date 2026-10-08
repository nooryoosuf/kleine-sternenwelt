"use client";
import { useEffect, useMemo, useState } from "react";

/** Deterministic PRNG so background stars never jump between renders. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function BackdropStars({ motion, count = 150 }: { motion: boolean; count?: number }) {
  const stars = useMemo(() => {
    const rnd = mulberry32(20261008);
    return Array.from({ length: motion ? count : Math.min(60, count) }, (_, i) => ({
      id: i,
      x: rnd() * 100,
      y: rnd() * 100,
      s: 0.6 + rnd() * 1.8,
      d: rnd() * 4,
      dur: 2.4 + rnd() * 4,
      o: 0.25 + rnd() * 0.55,
    }));
  }, [motion, count]);
  return (
    <div className="absolute inset-0" aria-hidden>
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-[#dfe8ff]"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.s,
            height: s.s,
            opacity: s.o,
            animation: motion ? `sky-twinkle ${s.dur}s ease-in-out infinite` : undefined,
            animationDelay: `${s.d}s`,
          }}
        />
      ))}
    </div>
  );
}

export function Nebula() {
  return (
    <div className="absolute inset-0" aria-hidden>
      <div className="absolute inset-0" style={{ background: "radial-gradient(60% 45% at 18% 22%, rgba(91,110,220,0.20), transparent 70%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(55% 40% at 82% 68%, rgba(150,110,220,0.14), transparent 70%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(40% 30% at 60% 12%, rgba(255,214,150,0.07), transparent 70%)" }} />
      {/* faint drifting cloud bands */}
      <div className="cloud-a absolute -left-1/4 top-[30%] h-24 w-[150%] rounded-[100%] bg-[#aebadd]/[0.05] blur-2xl" />
      <div className="cloud-b absolute -left-1/4 top-[62%] h-28 w-[150%] rounded-[100%] bg-[#aebadd]/[0.04] blur-2xl" />
      <style>{`
        @keyframes sky-twinkle { 0%,100% { opacity: .18; } 50% { opacity: .85; } }
        @keyframes cloud-drift-a { 0%,100% { transform: translateX(0); } 50% { transform: translateX(4%); } }
        @keyframes cloud-drift-b { 0%,100% { transform: translateX(3%); } 50% { transform: translateX(-2%); } }
        .cloud-a { animation: cloud-drift-a 46s ease-in-out infinite; }
        .cloud-b { animation: cloud-drift-b 64s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .cloud-a, .cloud-b { animation: none; } }
      `}</style>
    </div>
  );
}

export function ShootingStars({ motion }: { motion: boolean }) {
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (!motion) return;
    const iv = setInterval(() => setKey((k) => k + 1), 11_000);
    return () => clearInterval(iv);
  }, [motion]);
  if (!motion) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden key={key}>
      <span className="shoot absolute left-[62%] top-[8%] block h-px w-28 origin-left bg-gradient-to-l from-white via-white/80 to-transparent">
        <style>{`
          @keyframes shoot-across { 0% { transform: rotate(-24deg) translateX(0); opacity: 0; } 6% { opacity: 1; } 30% { transform: rotate(-24deg) translateX(-46vw); opacity: 0; } 100% { opacity: 0; } }
          .shoot { animation: shoot-across 3.2s ease-out .8s 1; opacity: 0; }
        `}</style>
      </span>
    </div>
  );
}

export function Dust({ motion }: { motion: boolean }) {
  const dots = useMemo(() => {
    const rnd = mulberry32(77);
    return Array.from({ length: motion ? 16 : 0 }, (_, i) => ({ id: i, x: rnd() * 100, y: 30 + rnd() * 65, d: rnd() * 6 }));
  }, [motion]);
  if (!motion) return null;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute h-1 w-1 rounded-full bg-amber-100/60"
          style={{ left: `${d.x}%`, top: `${d.y}%`, animation: `dust-float 9s ease-in-out infinite`, animationDelay: `${d.d}s` }}
        />
      ))}
      <style>{`@keyframes dust-float { 0%,100% { transform: translateY(0); opacity: .2; } 50% { transform: translateY(-16px); opacity: .7; } }`}</style>
    </div>
  );
}

export function Rain({ motion }: { motion: boolean }) {
  const drops = useMemo(() => {
    const rnd = mulberry32(4242);
    return Array.from({ length: motion ? 70 : 0 }, (_, i) => ({
      id: i,
      x: rnd() * 100,
      y: rnd() * 100,
      h: 10 + rnd() * 14,
      dur: 0.9 + rnd() * 0.8,
      delay: rnd() * 2,
      o: 0.2 + rnd() * 0.25,
    }));
  }, [motion]);
  if (!motion) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {drops.map((d) => (
        <span
          key={d.id}
          className="absolute block w-px bg-gradient-to-b from-transparent via-[#9db8ff]/70 to-transparent"
          style={{ left: `${d.x}%`, top: `${d.y}%`, height: d.h, opacity: d.o, animation: `rain-fall ${d.dur}s linear infinite`, animationDelay: `${d.delay}s` }}
        />
      ))}
      <style>{`@keyframes rain-fall { 0% { transform: translateY(-12vh); } 100% { transform: translateY(112vh); } }`}</style>
    </div>
  );
}
