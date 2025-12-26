import { useRef, useCallback } from 'react';

export type VADState = 'idle' | 'listening' | 'speaking' | 'paused' | 'processing';

type Callbacks = {
  onSpeech?: () => void;
  onSilence?: () => void;
  onInactivity?: () => void; // Called after 5 seconds of no speech
  onAudioLevel?: (level: number) => void; // Real-time audio level (0-1)
  onStateChange?: (state: VADState) => void;
};

type Options = {
  threshold: number;
  silenceMs: number;
  inactivityMs: number; // Time before considering user inactive
  intervalMs: number;
  minSpeechMs: number;
  adaptNoise: boolean;
  noiseFloorAlpha: number;
  noiseMultiplier: number;
  releaseMultiplier: number;
  cooldownMs: number;
};

const defaults: Options = {
  threshold: 0.02,
  silenceMs: 2500, // Time to wait after speech stops before sending (increased from 1200ms to 2.5s)
  inactivityMs: 5000, // 5 seconds of no speech = inactive
  intervalMs: 90,
  minSpeechMs: 220,
  adaptNoise: true,
  noiseFloorAlpha: 0.05,
  noiseMultiplier: 2.0,
  releaseMultiplier: 1.3,
  cooldownMs: 600,
};

export function useEnhancedVAD(opts?: Partial<Options>) {
  const options = { ...defaults, ...(opts || {}) } as Options;
  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const hpRef = useRef<BiquadFilterNode | null>(null);
  const lpRef = useRef<BiquadFilterNode | null>(null);
  const dataRef = useRef<Float32Array | null>(null);
  const timerRef = useRef<number | null>(null);
  const speakingRef = useRef(false);
  const lastVoiceRef = useRef<number>(0);
  const speechStartRef = useRef<number>(0);
  const noiseFloorRef = useRef<number>(0);
  const cooldownUntilRef = useRef<number>(0);
  const stateRef = useRef<VADState>('idle');
  const callbacksRef = useRef<Callbacks>({});
  const inactivityTimerRef = useRef<number | null>(null);

  const setState = useCallback((newState: VADState) => {
    if (stateRef.current !== newState) {
      stateRef.current = newState;
      callbacksRef.current.onStateChange?.(newState);
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    
    // Start new inactivity timer
    inactivityTimerRef.current = window.setTimeout(() => {
      if (stateRef.current === 'listening' || stateRef.current === 'idle') {
        setState('paused');
        callbacksRef.current.onInactivity?.();
      }
    }, options.inactivityMs);
  }, [options.inactivityMs, setState]);

  const start = useCallback((stream: MediaStream, cbs?: Callbacks) => {
    // Clean up previous resources without emitting an 'idle' state to avoid
    // triggering external auto-start effects reentrantly.
    stop(true);
    callbacksRef.current = cbs || {};
    
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 90;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3600;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    src.connect(hp);
    hp.connect(lp);
    lp.connect(analyser);

    ctxRef.current = ctx;
    srcRef.current = src;
    hpRef.current = hp;
    lpRef.current = lp;
    analyserRef.current = analyser;
    dataRef.current = new Float32Array(analyser.fftSize);
    speakingRef.current = false;
    lastVoiceRef.current = performance.now();
    speechStartRef.current = 0;
    noiseFloorRef.current = 0;
    cooldownUntilRef.current = 0;
    setState('listening');
    resetInactivityTimer();

    const tick = () => {
      if (!analyserRef.current || !dataRef.current) return;
      
      // @ts-ignore - Web Audio API compatibility issue with Float32Array types
      analyserRef.current.getFloatTimeDomainData(dataRef.current);
      let sum = 0;
      for (let i = 0; i < dataRef.current.length; i++) {
        const v = dataRef.current[i];
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataRef.current.length);

      const dynamicBase = options.adaptNoise
        ? Math.max(options.threshold, noiseFloorRef.current * options.noiseMultiplier)
        : options.threshold;

      const startThreshold = dynamicBase;
      const stopThreshold = dynamicBase / options.releaseMultiplier;

      const normalizedLevel = Math.min(rms / startThreshold, 1.0);
      callbacksRef.current.onAudioLevel?.(normalizedLevel);
      // While paused or processing, do not change VAD state based on audio.
      if (stateRef.current === 'paused' || stateRef.current === 'processing') {
        return;
      }

      const now = performance.now();
      if (!speakingRef.current) {
        if (options.adaptNoise) {
          noiseFloorRef.current = (1 - options.noiseFloorAlpha) * noiseFloorRef.current + options.noiseFloorAlpha * rms;
        }
        if (rms > startThreshold && now >= cooldownUntilRef.current) {
          if (speechStartRef.current === 0) speechStartRef.current = now;
          if (now - speechStartRef.current >= options.minSpeechMs) {
            speakingRef.current = true;
            lastVoiceRef.current = now;
            setState('speaking');
            callbacksRef.current.onSpeech?.();
          }
        } else {
          speechStartRef.current = 0;
        }
      } else {
        if (rms > stopThreshold) {
          lastVoiceRef.current = now;
          resetInactivityTimer();
        } else if (now - lastVoiceRef.current > options.silenceMs) {
          speakingRef.current = false;
          speechStartRef.current = 0;
          cooldownUntilRef.current = now + options.cooldownMs;
          setState('listening');
          callbacksRef.current.onSilence?.();
        }
      }
    };

    const intervalId = window.setInterval(tick, options.intervalMs);
    timerRef.current = intervalId as unknown as number;
  }, [options, setState, resetInactivityTimer]);

  const stop = useCallback((suppressState: boolean = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    try { srcRef.current?.disconnect(); } catch {}
    try { hpRef.current?.disconnect(); } catch {}
    try { lpRef.current?.disconnect(); } catch {}
    try { analyserRef.current?.disconnect(); } catch {}
    srcRef.current = null;
    hpRef.current = null;
    lpRef.current = null;
    analyserRef.current = null;
    dataRef.current = null;
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    speakingRef.current = false;
    if (!suppressState) {
      setState('idle');
    }
  }, [setState]);

  const resume = useCallback(() => {
    if (stateRef.current === 'paused') {
      setState('listening');
      resetInactivityTimer();
    }
  }, [setState, resetInactivityTimer]);

  const pause = useCallback(() => {
    setState('paused');
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, [setState]);

  const setProcessing = useCallback((processing: boolean) => {
    setState(processing ? 'processing' : 'listening');
    if (!processing) {
      resetInactivityTimer();
    }
  }, [setState, resetInactivityTimer]);

  return { 
    start, 
    stop, 
    resume, 
    pause, 
    setProcessing,
    currentState: stateRef.current 
  };
}
