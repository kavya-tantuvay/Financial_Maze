/**
 * useSound.js
 *
 * All the game audio, generated in the browser with the Web Audio API.
 *
 * Why no mp3 files: synthesising short tones in code means zero audio assets
 * to download, no extra library in the bundle, and no licensing questions.
 * The ambient pad is two slow detuned oscillators through a low-pass filter,
 * which is enough to give the maze a calm hum without being distracting.
 *
 * Browsers block audio until the user interacts with the page, so the audio
 * context is only created on the first click/keypress (see unlock()).
 */

import { useEffect, useRef, useCallback } from "react";

export function useSound(muted) {
  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const ambientRef = useRef(null);

  /** Creates the audio context on first use. Safe to call many times. */
  const getContext = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);

    ctxRef.current = ctx;
    masterRef.current = master;
    return ctx;
  }, []);

  /**
   * Plays a short note. Every game sound is built out of these.
   * `type` is the oscillator shape, `freq` the pitch in Hz.
   */
  const blip = useCallback(
    (freq, duration, type = "sine", volume = 0.3, delay = 0) => {
      const ctx = getContext();
      if (!ctx || !masterRef.current) return;

      const start = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);

      // Quick attack, smooth exponential decay - stops the clicking you get
      // from cutting a waveform off abruptly.
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(masterRef.current);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    },
    [getContext]
  );

  /** Starts the looping ambient pad. Called once, after the first interaction. */
  const startAmbient = useCallback(() => {
    const ctx = getContext();
    if (!ctx || ambientRef.current || !masterRef.current) return;

    const gain = ctx.createGain();
    gain.gain.value = 0.0;
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 3);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;

    // Two oscillators a few cents apart give a slow, wide beating drone.
    const oscA = ctx.createOscillator();
    oscA.type = "sine";
    oscA.frequency.value = 55;
    const oscB = ctx.createOscillator();
    oscB.type = "triangle";
    oscB.frequency.value = 82.5;

    // A very slow LFO breathing on the filter keeps the pad from feeling static.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain);
    gain.connect(masterRef.current);

    oscA.start();
    oscB.start();
    lfo.start();

    ambientRef.current = { gain };
  }, [getContext]);

  /**
   * Call this from a real user gesture (click or keypress). Browsers keep the
   * audio context suspended until then.
   */
  const unlock = useCallback(() => {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    startAmbient();
  }, [getContext, startAmbient]);

  // Mute simply drops the master gain; the oscillators keep running so
  // unmuting is instant and the ambient loop never restarts mid-phrase.
  useEffect(() => {
    if (!masterRef.current || !ctxRef.current) return;
    const target = muted ? 0.0001 : 0.35;
    masterRef.current.gain.exponentialRampToValueAtTime(
      target,
      ctxRef.current.currentTime + 0.2
    );
  }, [muted]);

  // ---- The named sounds the game actually plays -------------------------

  const sounds = {
    /** Rising three-note arpeggio - a good financial decision. */
    coin: () => {
      blip(880, 0.12, "square", 0.22);
      blip(1174, 0.14, "square", 0.18, 0.07);
      blip(1568, 0.22, "sine", 0.16, 0.14);
    },
    /** Low descending two-tone buzz - a poor decision. */
    warning: () => {
      blip(220, 0.2, "sawtooth", 0.14);
      blip(155, 0.3, "sawtooth", 0.12, 0.12);
    },
    /** Neutral confirmation for an "okay" choice. */
    neutral: () => {
      blip(523, 0.14, "sine", 0.18);
      blip(659, 0.18, "sine", 0.14, 0.08);
    },
    /** Soft tick when a decision node comes into range. */
    node: () => blip(1046, 0.09, "sine", 0.12),
    /** Four-note fanfare on finishing a level. */
    levelComplete: () => {
      [523, 659, 784, 1046].forEach((f, i) =>
        blip(f, 0.3, "triangle", 0.2, i * 0.13)
      );
    },
    /** Click feedback on buttons. */
    click: () => blip(660, 0.06, "sine", 0.1),
  };

  return { sounds, unlock };
}
