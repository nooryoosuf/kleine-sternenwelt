"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Constellation, StarPersist } from "@/types/stars";
import { ALL_STARS, CONSTELLATIONS, SECRET_STAR, STARS, STAR_SCHEDULE } from "@/data/stars";
import { STAR_STORE_KEY, localStorageAdapter } from "@/services/persistence-service";
import { newlyCompleted, constellationProgress } from "@/services/constellation-service";
import { resolveStars, todayStr, type ResolvedStar } from "@/services/star-service";

const MOON_TAPS_NEEDED = 3;

function defaults(): StarPersist {
  return { discovered: {}, revealedConstellations: [], lastVisit: null, firstSeen: null, moonTaps: 0 };
}

interface StarStore {
  resolved: ResolvedStar[];
  availableCount: number;
  discoveredCount: number;
  /** stars waiting that appeared while away (for the "busy sky" moment) */
  catchUpCount: number;
  progress: ReturnType<typeof constellationProgress>;
  revealed: Constellation[];
  pendingReveal: Constellation | null;
  secretUnlocked: boolean;
  moonTaps: number;
  today: string;
  introSeen: boolean;
  discover: (id: string) => void;
  tapMoon: () => boolean;
  dismissReveal: () => void;
  markVisited: () => void;
  markIntroSeen: () => void;
  byId: (id: string) => ResolvedStar | undefined;
}

const Ctx = createContext<StarStore | null>(null);

export function StarProvider({ children }: { children: React.ReactNode }) {
  const [persist, setPersist] = useState<StarPersist>(() => defaults());
  const [hydrated, setHydrated] = useState(false);
  const [today, setToday] = useState(() => todayStr());
  const [pendingReveal, setPendingReveal] = useState<Constellation | null>(null);
  const [catchUpCount, setCatchUpCount] = useState(0);

  // hydrate once + keep calendar-day correct across midnight / tab refocus
  useEffect(() => {
    setPersist(localStorageAdapter.load<StarPersist>(STAR_STORE_KEY, defaults()));
    setHydrated(true);
    const update = () => setToday(todayStr());
    const iv = setInterval(update, 30_000);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
    };
  }, []);

  useEffect(() => {
    if (hydrated) localStorageAdapter.save(STAR_STORE_KEY, persist);
  }, [persist, hydrated]);

  // "the sky has been busy while you were away" — computed once per load
  useEffect(() => {
    if (!hydrated) return;
    setPersist((p) => {
      const first = p.firstSeen ?? todayStr();
      const away = p.lastVisit !== null && p.lastVisit < todayStr();
      if (away) {
        const waiting = resolveStars(STARS, [], p.discovered, false, todayStr(), STAR_SCHEDULE).filter(
          (r) => r.state === "available"
        ).length;
        if (waiting >= 2) setCatchUpCount(waiting);
      }
      if (p.firstSeen) return p;
      return { ...p, firstSeen: first };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const secretUnlocked = (persist.moonTaps ?? 0) >= MOON_TAPS_NEEDED || !!persist.discovered[SECRET_STAR.id];

  const resolved = useMemo(
    () => resolveStars(STARS, [SECRET_STAR], persist.discovered, secretUnlocked, today, STAR_SCHEDULE),
    [persist.discovered, secretUnlocked, today]
  );

  const progress = useMemo(() => constellationProgress(CONSTELLATIONS, persist.discovered), [persist.discovered]);
  const revealed = useMemo(
    () => CONSTELLATIONS.filter((c) => persist.revealedConstellations.includes(c.id)),
    [persist.revealedConstellations]
  );

  const discover = useCallback((id: string) => {
    setPersist((p) => {
      if (p.discovered[id]) return p;
      const at = new Date().toISOString();
      const discovered = { ...p.discovered, [id]: at };
      const fresh = newlyCompleted(CONSTELLATIONS, discovered, p.revealedConstellations);
      if (fresh.length > 0) setPendingReveal(fresh[0]);
      return {
        ...p,
        discovered,
        revealedConstellations: [...p.revealedConstellations, ...fresh.map((c) => c.id)],
      };
    });
  }, []);

  const tapMoon = useCallback(() => {
    let unlocked = false;
    setPersist((p) => {
      if ((p.moonTaps ?? 0) >= MOON_TAPS_NEEDED || p.discovered[SECRET_STAR.id]) return p;
      const taps = (p.moonTaps ?? 0) + 1;
      unlocked = taps >= MOON_TAPS_NEEDED;
      return { ...p, moonTaps: taps };
    });
    return unlocked;
  }, []);

  const dismissReveal = useCallback(() => setPendingReveal(null), []);
  const markVisited = useCallback(() => {
    setCatchUpCount(0);
    setPersist((p) => ({ ...p, lastVisit: todayStr() }));
  }, []);

  const markIntroSeen = useCallback(() => {
    setPersist((p) => (p.introSeen ? p : { ...p, introSeen: true }));
  }, []);

  const byId = useCallback((id: string) => resolved.find((r) => r.star.id === id), [resolved]);

  const value = useMemo<StarStore>(
    () => ({
      resolved,
      availableCount: resolved.filter((r) => r.state === "available").length,
      discoveredCount: Object.keys(persist.discovered).length,
      catchUpCount,
      progress,
      revealed,
      pendingReveal,
      secretUnlocked,
      moonTaps: persist.moonTaps ?? 0,
      today,
      introSeen: !!persist.introSeen,
      discover,
      tapMoon,
      dismissReveal,
      markVisited,
      markIntroSeen,
      byId,
    }),
    [resolved, persist.discovered, persist.moonTaps, persist.introSeen, catchUpCount, progress, revealed, pendingReveal, secretUnlocked, today, discover, tapMoon, dismissReveal, markVisited, markIntroSeen, byId]
  );

  // keep ALL_STARS referenced for future admin-driven star types
  void ALL_STARS;

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStars() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStars outside StarProvider");
  return v;
}
