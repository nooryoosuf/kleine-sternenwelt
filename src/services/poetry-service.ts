import { localStorageAdapter } from "@/services/persistence-service";
import type { PoetryPageState, PoetryPersist } from "@/types/poetry";

const KEY = "ksw-poetry-v1";

function defaults(): PoetryPersist {
  return { introSeen: false, pages: {} };
}

export function getPoetryState(): PoetryPersist {
  return localStorageAdapter.load<PoetryPersist>(KEY, defaults());
}

function save(s: PoetryPersist) {
  localStorageAdapter.save(KEY, s);
}

export function setPoetryIntroSeen() {
  const s = getPoetryState();
  if (!s.introSeen) save({ ...s, introSeen: true });
}

export function markPoemDiscovered(id: string) {
  const s = getPoetryState();
  const prev = s.pages[id] ?? {};
  if (!prev.discoveredAt) {
    save({ ...s, pages: { ...s.pages, [id]: { ...prev, discoveredAt: new Date().toISOString() } } });
    onPoetryPageDiscovered(id);
  }
}

export function markPoemKept(id: string) {
  const s = getPoetryState();
  const prev = s.pages[id] ?? {};
  save({ ...s, pages: { ...s.pages, [id]: { ...prev, keptAt: new Date().toISOString() } } });
}

export function pageState(id: string): PoetryPageState {
  return getPoetryState().pages[id] ?? {};
}

export function resetPoem(id: string) {
  const s = getPoetryState();
  const pages = { ...s.pages };
  delete pages[id];
  save({ ...s, pages });
}

export function resetPoetryAll() {
  save(defaults());
}

/**
 * Fired once when a poem is first opened.
 * The constellation system will eventually listen for this to unlock a star.
 * For now it is only a documented event — no integration yet.
 */
export function onPoetryPageDiscovered(id: string) {
  try {
    window.dispatchEvent(new CustomEvent<string>("poetry:discovered", { detail: id }));
  } catch {
    /* non-browser or restricted — the page still works */
  }
}
