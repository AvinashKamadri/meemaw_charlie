import { useState, useRef, useCallback } from 'react';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<MediaStream | null>;
  stopRecording: () => Promise<Blob | null>;
  audioBlob: Blob | null;
  requestPermission: () => Promise<boolean>;
  hasPermission: boolean | null; // null = not checked, true = granted, false = denied
  currentStream: MediaStream | null;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const ts = () => new Date().toISOString();
  const log = (...args: any[]) => console.log(`[Recorder ${ts()}]`, ...args);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: false,
            channelCount: 1,
          } as any,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      // Stop the stream immediately - we just wanted to check permission
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  const startRecording = useCallback(async (): Promise<MediaStream | null> => {
    try {
      // Request microphone access (or request permission if not already granted)
      if (hasPermission === null || hasPermission === false) {
        const granted = await requestPermission();
        if (!granted) {
          alert('Microphone permission is required to record audio.');
          return null;
        }
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: false,
            channelCount: 1,
          } as any,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      streamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          log('ondataavailable', { size: event.data.size });
        }
      };

      // Start recording
      log('start');
      mediaRecorder.start(50);
      setIsRecording(true);
      return stream;
    } catch (error) {
      console.error('Error starting recording:', error);
      setHasPermission(false);
      alert('Could not access microphone. Please check permissions.');
      return null;
    }
  }, [hasPermission, requestPermission]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mr = mediaRecorderRef.current;

      const finalize = () => {
        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          log('finalize blob', { size: blob.size });
          setAudioBlob(blob);
          setIsRecording(false);
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          resolve(blob);
        } catch (e) {
          console.error('[Recorder] finalize error', e);
          resolve(null);
        }
      };

      // If no recorder, attempt to finalize from existing chunks
      if (!mr) {
        if (audioChunksRef.current.length > 0) {
          finalize();
        } else {
          resolve(null);
        }
        return;
      }

      const onStop = () => {
        log('onstop');
        setTimeout(finalize, 250);
        mr.onstop = null;
      };

      const state = (mr as any).state;
      if (state === 'inactive') {
        // Already stopped – finalize what we have
        if (audioChunksRef.current.length === 0) {
          setTimeout(finalize, 50);
        } else {
          finalize();
        }
        return;
      }

      mr.onstop = onStop;
      try {
        log('stop');
        try {
          // Flush any buffered data before stopping to ensure a non-empty blob
          if (typeof (mr as any).requestData === 'function') {
            (mr as any).requestData();
          }
        } catch {}
        mr.stop();
      } catch (e) {
        console.error('[Recorder] stop error', e);
        if (audioChunksRef.current.length > 0) {
          finalize();
        } else {
          resolve(null);
        }
      }
    });
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    requestPermission,
    hasPermission,
    currentStream: streamRef.current,
  };
};
