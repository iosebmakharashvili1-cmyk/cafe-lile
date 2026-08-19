import { useCallback, useRef, useState } from "react";

type SoundState = "locked" | "unlocking" | "armed" | "blocked";

export function useKitchenSound() {
  const [soundState, setSoundState] = useState<SoundState>("locked");
  const audioContextRef = useRef<AudioContext | null>(null);

  const playChime = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state !== "running") return;

    // Simple two-tone chime, synthesized (no external audio file dependency).
    const now = ctx.currentTime;
    for (const [freq, start, dur] of [
      [880, 0, 0.14],
      [1175, 0.12, 0.22],
    ] as const) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.22, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    }
  }, []);

  const enableSound = useCallback(async () => {
    setSoundState("unlocking");
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      await ctx.resume();
      audioContextRef.current = ctx;
      setSoundState("armed");
      playChime(); // audible confirmation the unlock worked
    } catch {
      setSoundState("blocked");
    }
  }, [playChime]);

  return { soundState, enableSound, playChime };
}
