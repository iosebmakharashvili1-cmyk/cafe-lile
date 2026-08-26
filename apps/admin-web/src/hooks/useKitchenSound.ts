import { useCallback, useEffect, useRef, useState } from "react";

type SoundState = "locked" | "unlocking" | "armed" | "blocked" | "disabled";

const STORAGE_KEY = "cafe-lile-kitchen-sound-enabled";

function readPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "false"; // default: enabled
  } catch {
    return true;
  }
}

function writePreference(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // localStorage unavailable (private browsing, etc.) — sound just won't persist.
  }
}

/**
 * Kitchen sound stays armed permanently once unlocked, across reloads,
 * until explicitly turned off from Settings. Browsers still require one
 * user gesture per page load to actually start audio playback, so on each
 * fresh load the banner asks for that one tap — but only if the staff
 * hasn't disabled sound altogether in Settings.
 */
export function useKitchenSound() {
  const preferenceEnabled = useRef(readPreference());
  const [soundState, setSoundState] = useState<SoundState>(
    preferenceEnabled.current ? "locked" : "disabled"
  );
  const audioContextRef = useRef<AudioContext | null>(null);

  // If the preference flips to disabled elsewhere (e.g. Settings page, same tab),
  // stop treating the sound as armed.
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        const enabled = e.newValue !== "false";
        preferenceEnabled.current = enabled;
        if (!enabled) setSoundState("disabled");
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

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
      preferenceEnabled.current = true;
      writePreference(true);
      setSoundState("armed");
      playChime(); // audible confirmation the unlock worked
    } catch {
      setSoundState("blocked");
    }
  }, [playChime]);

  /** Called from Settings to permanently turn kitchen sound off. */
  const disableSound = useCallback(() => {
    preferenceEnabled.current = false;
    writePreference(false);
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    setSoundState("disabled");
  }, []);

  /** Called from Settings to turn kitchen sound back on (re-prompts for the browser gesture). */
  const reEnableSound = useCallback(() => {
    preferenceEnabled.current = true;
    writePreference(true);
    setSoundState("locked");
  }, []);

  return { soundState, enableSound, disableSound, reEnableSound, playChime, isPermanentlyDisabled: soundState === "disabled" };
}
