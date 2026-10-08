// Tiny audio architecture: central manager, no autoplay, respects settings.
let ctx: AudioContext | null = null;
let ambientNodes: { stop: () => void } | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function blip(freq = 660, dur = 0.12, type: OscillatorType = "sine", gain = 0.06) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("ksw-mute") === "1") return;
  try {
    const c = ac();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  } catch {}
}

export const sfx = {
  tap: () => blip(520, 0.08, "sine", 0.05),
  open: () => {
    blip(392, 0.12, "triangle", 0.06);
    setTimeout(() => blip(587, 0.16, "triangle", 0.06), 90);
  },
  paper: () => {
    blip(1200, 0.05, "sawtooth", 0.015);
    setTimeout(() => blip(900, 0.07, "sawtooth", 0.012), 60);
  },
  discover: () => {
    blip(523, 0.14, "sine", 0.06);
    setTimeout(() => blip(659, 0.14, "sine", 0.06), 120);
    setTimeout(() => blip(784, 0.22, "sine", 0.07), 240);
  },
  soft: () => blip(440, 0.2, "sine", 0.04),
};

export function startAmbient(moodId: string) {
  stopAmbient();
  if (typeof window === "undefined") return;
  if (localStorage.getItem("ksw-mute") === "1") return;
  try {
    const c = ac();
    if (!c) return;
    // Very quiet filtered noise-ish pad using oscillators
    const o1 = c.createOscillator();
    const o2 = c.createOscillator();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    o1.type = "sine";
    o2.type = "sine";
    const base = moodId === "happy" ? 174 : moodId === "loved" ? 196 : 146;
    o1.frequency.value = base;
    o2.frequency.value = base * 1.5;
    f.type = "lowpass";
    f.frequency.value = 420;
    g.gain.value = 0.018;
    o1.connect(f);
    o2.connect(f);
    f.connect(g).connect(c.destination);
    o1.start();
    o2.start();
    ambientNodes = {
      stop: () => {
        try {
          o1.stop();
          o2.stop();
          g.disconnect();
        } catch {}
      },
    };
  } catch {}
}

export function stopAmbient() {
  try {
    ambientNodes?.stop();
  } catch {}
  ambientNodes = null;
}
