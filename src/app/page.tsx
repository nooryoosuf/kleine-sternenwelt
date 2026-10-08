"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { MoonStar } from "lucide-react";
import { BackdropStars, Dust, Nebula } from "@/components/sky/decor";
import { sfx } from "@/lib/audio";

export default function Landing() {
  return (
    <main
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 text-center"
      style={{ background: "linear-gradient(180deg, #04061a 0%, #0a1030 50%, #18224d 100%)" }}
    >
      <div className="absolute inset-0" aria-hidden>
        <Nebula />
        <BackdropStars motion />
        <Dust motion />
      </div>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1 }} className="relative max-w-md">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-amber-200 backdrop-blur-md">
          <MoonStar size={22} />
        </div>
        <p className="font-body text-[11px] uppercase tracking-[0.35em] text-amber-100/60">a quiet place, just for you</p>
        <h1 className="mt-3 font-display text-5xl italic leading-tight text-amber-50 sm:text-6xl">
          Kleine
          <br />
          Sternenwelt
        </h1>
        <p className="mt-4 font-body text-[15px] leading-relaxed text-white/70">Your little corner of the universe.</p>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-amber-200/70" aria-hidden>
          <span className="h-1 w-1 rounded-full bg-amber-200" />
          <span className="h-px w-16 bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />
          <span className="h-1 w-1 rounded-full bg-amber-200" />
        </div>
        <Link
          href="/mood"
          onClick={() => sfx.open()}
          className="group mx-auto mt-8 flex w-full max-w-[280px] items-center justify-center gap-2 rounded-full bg-amber-100 px-7 py-4 font-body text-[15px] font-semibold text-stone-900 shadow-glow transition active:scale-95"
        >
          Enter your little world
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
        <p className="mt-5 font-body text-xs text-white/40">best with sound on · made to be kept on your phone 🌙</p>
      </motion.div>
      <motion.div
        className="absolute bottom-[12%] left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-amber-200 shadow-glow"
        animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
        transition={{ duration: 3.5, repeat: Infinity }}
        aria-hidden
      />
    </main>
  );
}
