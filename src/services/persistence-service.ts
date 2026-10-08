/**
 * Persistence abstraction. The UI talks to this interface only,
 * so localStorage can later be swapped for Supabase without touching components.
 */
export interface StorageAdapter {
  load<T>(key: string, fallback: T): T;
  save(key: string, value: unknown): void;
  remove(key: string): void;
}

export const localStorageAdapter: StorageAdapter = {
  load<T>(key: string, fallback: T): T {
    try {
      if (typeof window === "undefined") return fallback;
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      return { ...fallback, ...JSON.parse(raw) } as T;
    } catch {
      return fallback;
    }
  },
  save(key: string, value: unknown): void {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode etc. — the sky still works for the session */
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  },
};

export const STAR_STORE_KEY = "ksw-stars-v1";
