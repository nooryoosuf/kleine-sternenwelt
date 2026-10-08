"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { MoodId } from "@/lib/moods";

const KEY = "ksw-prefs-v1";

interface Prefs {
  mood: MoodId | null;
}

interface PrefsStore {
  mood: MoodId | null;
  setMood: (m: MoodId) => void;
}

const Ctx = createContext<PrefsStore | null>(null);

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { mood: null };
    return { mood: (JSON.parse(raw) as Prefs).mood ?? null };
  } catch {
    return { mood: null };
  }
}

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>({ mood: null });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefs(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(KEY, JSON.stringify(prefs));
      } catch {}
    }
  }, [prefs, hydrated]);

  const setMood = useCallback((m: MoodId) => setPrefs((p) => ({ ...p, mood: m })), []);

  const value = useMemo(() => ({ mood: prefs.mood, setMood }), [prefs.mood, setMood]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePrefs outside PrefsProvider");
  return v;
}
