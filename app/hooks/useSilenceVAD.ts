import { useRef } from 'react';

type Callbacks = {
  onSpeech?: () => void;
  onSilence?: () => void;
};

type Options = {
  threshold: number;
  silenceMs: number;
  intervalMs: number;
};

const defaults: Options = {
  threshold: 0.015,
  silenceMs: 900,
  intervalMs: 80,
};

export function useSilenceVAD(opts?: Partial<Options>) {
  const options = { ...defaults, ...(opts || {}) } as Options;
  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const speakingRef = useRef(false);
  const lastVoiceRef = useRef<number>(0);

  const start = (stream: MediaStream, cbs?: Callbacks) => {
    stop();
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    src.connect(analyser);

    ctxRef.current = ctx;
    srcRef.current = src;
    analyserRef.current = analyser;
    // allocate using length ctor for compatibility
    dataRef.current = new Float32Array(analyser.fftSize);
    speakingRef.current = false;
    lastVoiceRef.current = performance.now();

    const tick = () => {
      if (!analyserRef.current || !dataRef.current) return;
      analyserRef.current.getFloatTimeDomainData(dataRef.current);
      let sum = 0;
      for (let i = 0; i < dataRef.current.length; i++) {
        const v = dataRef.current[i]; // already -1..1
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataRef.current.length);

      const now = performance.now();
      if (rms > options.threshold) {
        lastVoiceRef.current = now;
        if (!speakingRef.current) {
          speakingRef.current = true;
          cbs?.onSpeech?.();
        }
      } else {
        if (speakingRef.current && now - lastVoiceRef.current > options.silenceMs) {
          speakingRef.current = false;
          cbs?.onSilence?.();
        }
      }
    };

    const intervalId = window.setInterval(tick, options.intervalMs);
    timerRef.current = intervalId as unknown as number;
  };

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try { srcRef.current?.disconnect(); } catch {}
    try { analyserRef.current?.disconnect(); } catch {}
    srcRef.current = null;
    analyserRef.current = null;
    dataRef.current = null;
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    speakingRef.current = false;
  };

  return { start, stop };
}
