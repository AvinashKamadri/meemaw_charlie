import { useState, useRef, useCallback } from 'react';

export interface VoiceVisualizerReturn {
  audioLevel: number; // 0-1 normalized audio level
  isActive: boolean;
  start: (stream: MediaStream) => void;
  stop: () => void;
}

export const useVoiceVisualizer = (): VoiceVisualizerReturn => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const start = useCallback((stream: MediaStream) => {
    stop(); // Clean up any existing instance
    
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      
      // Configure analyser for better frequency analysis and responsiveness
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3; // Reduced from 0.8 for faster response
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      src.connect(analyser);
      
      ctxRef.current = ctx;
      srcRef.current = src;
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      setIsActive(true);
      
      const updateAudioLevel = () => {
        if (!analyserRef.current || !dataRef.current) return;
        
        // Get frequency data for better voice detection
        // @ts-ignore - Web Audio API compatibility issue with Uint8Array types
        analyserRef.current.getByteFrequencyData(dataRef.current);
        
        // Focus on human voice frequency range (85Hz - 255Hz, roughly bins 2-8 for 256 FFT)
        // and mid-range frequencies (300Hz - 3400Hz, roughly bins 9-35)
        let sum = 0;
        let count = 0;
        
        // Voice fundamental frequencies (85-300Hz)
        for (let i = 2; i <= 8; i++) {
          sum += dataRef.current[i];
          count++;
        }
        
        // Voice harmonics and formants (300-3400Hz)
        for (let i = 9; i <= 35; i++) {
          sum += dataRef.current[i] * 0.7; // Slightly less weight for harmonics
          count += 0.7;
        }
        
        // Normalize to 0-1 range
        const average = sum / count;
        const normalizedLevel = Math.min(average / 255, 1.0);
        
        // Apply minimal boost for better visualization
        const boostedLevel = normalizedLevel * 1.2; // Reduced boost for more accurate response
        const finalLevel = Math.min(boostedLevel, 1.0);
        
        setAudioLevel(finalLevel);
        
        if (isActive) {
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error starting voice visualizer:', error);
      setIsActive(false);
    }
  }, [isActive]);

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
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
    
    setIsActive(false);
    setAudioLevel(0);
  }, []);

  return {
    audioLevel,
    isActive,
    start,
    stop,
  };
};
