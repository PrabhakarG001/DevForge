import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechStatus = 'idle' | 'playing' | 'paused';

/**
 * Browser TTS via the Web Speech API. Never plays automatically — the user
 * must press play. Pause/resume use the utterance-level controls where
 * supported, otherwise they fall back to cancel/restart.
 */
export function useSpeech() {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef<string>('');
  const offsetRef = useRef<number>(0);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    utterRef.current = null;
    offsetRef.current = 0;
    setStatus('idle');
  }, [supported]);

  const speakFrom = useCallback(
    (fromOffset: number) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(textRef.current.slice(fromOffset));
      u.rate = 1.02;
      u.onend = () => {
        if (utterRef.current === u) setStatus('idle');
      };
      u.onerror = () => {
        if (utterRef.current === u) setStatus('idle');
      };
      utterRef.current = u;
      setStatus('playing');
      window.speechSynthesis.speak(u);
    },
    [supported],
  );

  const play = useCallback(
    (text: string) => {
      textRef.current = text;
      offsetRef.current = 0;
      speakFrom(0);
    },
    [speakFrom],
  );

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setStatus('paused');
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setStatus('playing');
  }, [supported]);

  useEffect(() => stop, [stop]);

  return { supported, status, play, pause, resume, stop };
}
