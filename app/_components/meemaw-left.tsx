"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PiMicrophoneDuotone, PiMicrophoneSlashDuotone } from "react-icons/pi";
import { RiVoiceAiFill } from "react-icons/ri";
import { IoMdClose } from "react-icons/io";
import { useMeemawStore } from "../_stores/meemaw-store";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useEnhancedVAD, type VADState } from "../hooks/useEnhancedVAD";
import GeminiWebGLWave from "./GeminiWebGLWave";

type IconProps = {
  className?: string;
};

function IconDot({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="8"
      height="8"
      viewBox="0 0 8 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="4" cy="4" r="3" fill="currentColor" />
    </svg>
  );
}

function IconKeyboard({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 7h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M7 11h.01M10 11h.01M13 11h.01M16 11h.01M17 14H7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FlashbackCard({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: "sea" | "warm";
}) {
  return (
    <div className="w-[260px] shrink-0 select-none">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
        <div
          className={
            tone === "sea"
              ? "h-[180px] w-full rounded-xl bg-gradient-to-br from-slate-400/30 via-amber-200/25 to-slate-900/40"
              : "h-[180px] w-full rounded-xl bg-gradient-to-br from-amber-100/20 via-zinc-700/25 to-zinc-950/60"
          }
        />
        <div className="mt-3">
          <div className="text-[14px] font-semibold text-white/90">
            {title}
          </div>
          <div className="mt-1 text-[12px] leading-5 text-white/55">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeemawLeft() {
  const screen = useMeemawStore((s) => s.screen);
  const setScreen = useMeemawStore((s) => s.setScreen);
  const isTextOpen = useMeemawStore((s) => s.isTextOpen);
  const setIsTextOpen = useMeemawStore((s) => s.setIsTextOpen);
  const textValue = useMeemawStore((s) => s.textValue);
  const setTextValue = useMeemawStore((s) => s.setTextValue);
  const messages = useMeemawStore((s) => s.messages);
  const addUserMessage = useMeemawStore((s) => s.addUserMessage);
  const addMeemawMessage = useMeemawStore((s) => s.addMeemawMessage);

  const glassyIconButtonBase =
    "relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-white/90 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition hover:bg-white/10 active:scale-[0.98]";
  const glassyIconButtonHighlight =
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-80";

  const isMicEnabled = useMeemawStore((s) => s.isMicEnabled);
  const isPaused = useMeemawStore((s) => s.isPaused);
  const vadState = useMeemawStore((s) => s.vadState);
  const setIsMicEnabled = useMeemawStore((s) => s.setIsMicEnabled);
  const setIsPaused = useMeemawStore((s) => s.setIsPaused);
  const setVadState = useMeemawStore((s) => s.setVadState);

  const micEnabledRef = useRef(true);
  const pausedRef = useRef(false);
  const startingRef = useRef(false);
  const sendingRef = useRef(false);
  const silenceTailTimerRef = useRef<number | null>(null);
  const utteranceStartAtRef = useRef<number>(0);
  const levelSumRef = useRef<number>(0);
  const levelCountRef = useRef<number>(0);

  const SILENCE_TAIL_MS = 600;
  const MIN_BLOB_BYTES = 3584;
  const MIN_UTTERANCE_MS = 550;
  const MIN_AVG_LEVEL = 0.07;

  const { isRecording, startRecording, stopRecording, stopStream } =
    useAudioRecorder();
  const vad = useEnhancedVAD({
    threshold: 0.0096,
    silenceMs: 1300, // vad 
    intervalMs: 20,
    inactivityMs: 20000,
    minSpeechMs: 260,
    adaptNoise: false,
    noiseFloorAlpha: 0.04,
    noiseMultiplier: 2.0,
    releaseMultiplier: 1.5,
    cooldownMs: 600,
  });

  const flashbacks = useMemo(
    () => [
      {
        tone: "sea" as const,
        title: "Summer of '99",
        description:
          "Do you remember that specific road trip? The music, the smell ...",
      },
      {
        tone: "warm" as const,
        title: "Holiday Traditions",
        description:
          "The recipes, the laughter, the little rituals that made it yours.",
      },
      {
        tone: "sea" as const,
        title: "First Day of School",
        description: "The classroom, the uniform, the faces you still remember.",
      },
      {
        tone: "warm" as const,
        title: "A Family Dinner",
        description:
          "Who was there, what was said, and what you felt in that moment.",
      },
      {
        tone: "sea" as const,
        title: "A Rainy Evening",
        description: "The sound on the windows, the smell in the air, the quiet.",
      },
      {
        tone: "warm" as const,
        title: "The Old Neighborhood",
        description:
          "Streets you walked, corners you turned, and people you knew.",
      },
    ],
    [],
  );

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  const stride = 260 + 16;

  useEffect(() => {
    micEnabledRef.current = isMicEnabled;
  }, [isMicEnabled]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    micEnabledRef.current = isMicEnabled;
    pausedRef.current = isPaused;
  }, []);

  const clearSilenceTailTimer = useCallback(() => {
    if (silenceTailTimerRef.current) {
      clearTimeout(silenceTailTimerRef.current);
      silenceTailTimerRef.current = null;
    }
  }, []);

  const stopAll = useCallback(async () => {
    clearSilenceTailTimer();
    vad.stop();
    if (isRecording) {
      try {
        await stopRecording();
      } catch {}
    }
    stopStream();
    setMicStream(null);
    setVadState("idle");
  }, [
    clearSilenceTailTimer,
    isRecording,
    setMicStream,
    setVadState,
    stopRecording,
    stopStream,
    vad,
  ]);

  const sendAudioAndWait = useCallback(
    async (_blob: Blob) => {
      vad.setProcessing(false);
    },
    [vad],
  );

  const stopAndSendAfterSilence = useCallback(async () => {
    if (sendingRef.current || vadState === "processing") return;
    sendingRef.current = true;

    try {
      clearSilenceTailTimer();
      vad.stop();

      const blob = await stopRecording();
      const dur = utteranceStartAtRef.current
        ? performance.now() - utteranceStartAtRef.current
        : 0;
      const avgLevel =
        levelCountRef.current > 0
          ? levelSumRef.current / levelCountRef.current
          : 0;

      utteranceStartAtRef.current = 0;
      levelSumRef.current = 0;
      levelCountRef.current = 0;

      if (
        blob &&
        blob.size >= MIN_BLOB_BYTES &&
        dur >= MIN_UTTERANCE_MS &&
        avgLevel >= MIN_AVG_LEVEL
      ) {
        vad.setProcessing(true);
        await sendAudioAndWait(blob);
      }

      if (micEnabledRef.current && !pausedRef.current && screen === "live") {
        setVadState("idle");
      }
    } finally {
      sendingRef.current = false;
    }
  }, [
    MIN_AVG_LEVEL,
    MIN_BLOB_BYTES,
    MIN_UTTERANCE_MS,
    clearSilenceTailTimer,
    screen,
    sendAudioAndWait,
    setMicStream,
    stopRecording,
    vad,
    vadState,
  ]);

  const handleInactivity = useCallback(async () => {
    setIsPaused(true);
    pausedRef.current = true;
    micEnabledRef.current = false;
    setIsMicEnabled(false);
    await stopAll();
    addMeemawMessage("Paused due to inactivity. Tap mic to resume.");
  }, [addMeemawMessage, setIsMicEnabled, setIsPaused, stopAll]);

  const handleAutoStartRecording = useCallback(async () => {
    if (screen !== "live") return;
    if (!micEnabledRef.current || pausedRef.current) return;
    if (startingRef.current || isRecording) return;
    if (vadState !== "idle") return;

    try {
      startingRef.current = true;
      const stream = await startRecording();
      if (!stream) return;

      if (!micEnabledRef.current || pausedRef.current || screen !== "live") {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      setMicStream(stream);

      vad.start(stream, {
        onSpeech: () => {
          clearSilenceTailTimer();
          utteranceStartAtRef.current = performance.now();
          levelSumRef.current = 0;
          levelCountRef.current = 0;
          setVadState("speaking");
        },
        onSilence: () => {
          clearSilenceTailTimer();
          silenceTailTimerRef.current = window.setTimeout(() => {
            void stopAndSendAfterSilence();
          }, SILENCE_TAIL_MS) as unknown as number;
        },
        onInactivity: () => {
          void handleInactivity();
        },
        onAudioLevel: (l) => {
          if (utteranceStartAtRef.current > 0) {
            levelSumRef.current += l;
            levelCountRef.current += 1;
          }
        },
        onStateChange: (s) => {
          setVadState(s);
        },
      });
    } finally {
      startingRef.current = false;
    }
  }, [
    SILENCE_TAIL_MS,
    clearSilenceTailTimer,
    handleInactivity,
    isRecording,
    screen,
    setMicStream,
    startRecording,
    stopAndSendAfterSilence,
    vad,
    vadState,
  ]);

  const handleToggleMic = useCallback(async () => {
    const next = !micEnabledRef.current;
    micEnabledRef.current = next;
    setIsMicEnabled(next);
    pausedRef.current = false;
    setIsPaused(false);

    if (!next) {
      await stopAll();
      return;
    }

    setVadState("idle");

    requestAnimationFrame(() => {
      if (!micEnabledRef.current || pausedRef.current) return;
      void handleAutoStartRecording();
    });
  }, [handleAutoStartRecording, setIsMicEnabled, setIsPaused, setVadState, stopAll]);

  const updateActiveIndex = () => {
    const el = carouselRef.current;
    if (!el) return;
    const idx = Math.max(
      0,
      Math.min(flashbacks.length - 1, Math.round(el.scrollLeft / stride)),
    );
    setActiveIndex(idx);
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      el.scrollBy({ left: e.deltaY, behavior: "smooth" });
      e.preventDefault();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  useEffect(() => {
    if (!isTextOpen) return;
    textInputRef.current?.focus();
  }, [isTextOpen]);

  useEffect(() => {
    if (screen !== "live") {
      void stopAll();
      return;
    }

    if (isMicEnabled && !isPaused && !isRecording && vadState === "idle") {
      void handleAutoStartRecording();
    }
  }, [
    handleAutoStartRecording,
    isMicEnabled,
    isPaused,
    isRecording,
    screen,
    stopAll,
    vadState,
  ]);

  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-black text-white select-none">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-black to-zinc-950" />
      <div className="pointer-events-none absolute -top-10 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl lg:left-36 lg:-translate-x-0" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-44 -right-28 h-[520px] w-[520px] rounded-full bg-rose-600/25 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[430px] lg:mx-0">
        <div className="relative flex min-h-[100dvh] flex-col box-border px-5 pb-8 pt-6">
          {screen === "home" ? (
            <>
              <section className="mt-6">
                <h1 className="text-balance text-center text-[20px] font-semibold leading-7 text-white/90">
                  Hi, I&apos;m MeeMa! <br />Your AI companion.
                </h1>
                <div className="mx-auto mt-5 h-px w-[260px] bg-white/10" />
              </section>

              <section className="mt-7">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                  Suggested trending flashbacks
                </div>

                <div
                  ref={carouselRef}
                  className="-mx-5 mt-4 flex flex-nowrap snap-x snap-proximity gap-4 overflow-x-auto overscroll-x-contain px-5 pb-2 pr-10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  style={{ touchAction: "pan-x" }}
                  onScroll={() => {
                    if (rafRef.current) cancelAnimationFrame(rafRef.current);
                    rafRef.current = requestAnimationFrame(() => {
                      updateActiveIndex();
                    });
                  }}
                  onPointerDown={(e) => {
                    const el = carouselRef.current;
                    if (!el) return;
                    isDraggingRef.current = true;
                    startXRef.current = e.clientX;
                    startScrollLeftRef.current = el.scrollLeft;
                    el.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    const el = carouselRef.current;
                    if (!el) return;
                    if (!isDraggingRef.current) return;
                    const dx = e.clientX - startXRef.current;
                    el.scrollLeft = startScrollLeftRef.current - dx;
                  }}
                  onPointerUp={() => {
                    isDraggingRef.current = false;
                    updateActiveIndex();
                  }}
                  onPointerCancel={() => {
                    isDraggingRef.current = false;
                  }}
                  onPointerLeave={() => {
                    isDraggingRef.current = false;
                  }}
                >
                  {flashbacks.map((card) => (
                    <FlashbackCard
                      key={card.title}
                      tone={card.tone}
                      title={card.title}
                      description={card.description}
                    />
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-center gap-2">
                  {flashbacks.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Go to card ${i + 1}`}
                      className={
                        i === activeIndex
                          ? "h-2 w-6 rounded-full bg-white/70"
                          : "h-2 w-2 rounded-full bg-white/20 hover:bg-white/35"
                      }
                      onClick={() => {
                        const el = carouselRef.current;
                        if (!el) return;
                        el.scrollTo({ left: i * stride, behavior: "smooth" });
                        setActiveIndex(i);
                      }}
                    />
                  ))}
                </div>
              </section>
            </>
          ) : (
            <>
              <section className="mt-3">
                <div className="text-center text-[14px] font-semibold text-white/85">
                  Live
                </div>
                <div className="mx-auto mt-4 h-px w-[260px] bg-white/10" />
              </section>

              <div className="relative mt-4 mb-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[34px]">
                <div
                  className="pointer-events-none absolute inset-0 z-0 rounded-[34px] border border-white/10 bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
                  style={{
                    WebkitMaskImage:
                      "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 16%, rgba(0,0,0,1) 100%)",
                    maskImage:
                      "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 16%, rgba(0,0,0,1) 100%)",
                  }}
                />
                <section className="relative z-10 flex min-h-0 flex-1 flex-col gap-3 overflow-auto overflow-x-hidden px-4 pb-62 pt-5">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={
                        m.role === "meemaw"
                          ? "mr-10 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] leading-6 text-white/85 break-words"
                          : "ml-10 rounded-2xl bg-white/10 px-4 py-3 text-[13px] leading-6 text-white/90 break-words"
                      }
                    >
                      {m.text}
                    </div>
                  ))}
                </section>

                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[450px] overflow-hidden opacity-95"
                  style={{
                    WebkitMaskImage:
                      "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)",
                    maskImage:
                      "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)",
                  }}
                  aria-hidden="true"
                >
                  <div className="absolute inset-0">
                    <GeminiWebGLWave stream={micStream} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 via-transparent to-transparent" />
                </div>
              </div>
            </>
          )}
                {/* pill */}
          <div className="relative mt-auto flex w-full flex-col items-center gap-4">
            <div className="relative z-10 w-full max-w-[320px]">
              <div className="relative flex h-12 w-full items-center rounded-full border border-white/10 bg-white/5 p-1 text-white/80 backdrop-blur-md gap-2">
                <div
                  className={
                    isTextOpen
                      ? "flex flex-1 items-center gap-2 rounded-full bg-white/10 px-3 transition-all duration-200"
                      : "flex w-1/2 items-center justify-center gap-2 rounded-full bg-white/10 px-3 transition-all duration-200"
                  }
                >   
                  {!isTextOpen ? (
                    <button
                      type="button"
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-[13px] font-medium text-white/90"
                      onClick={() => setIsTextOpen(true)}
                    >
                      <IconKeyboard className="h-4 w-4" />
                      Text
                    </button>
                  ) : (
                    <form
                      className="flex w-full items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const v = textValue.trim(); // trim whitespace
                        if (!v) return;
                        if (screen !== "live") {
                          setIsMicEnabled(false);// mic off with text mode
                          setScreen("live"); // navigate to the start screen on text send
                        }
                        addUserMessage(v);
                        setTextValue(""); // clear the text input
                        requestAnimationFrame(() => {
                          textInputRef.current?.focus();
                        });
                      }}
                    >
                      <IconKeyboard className="h-8 w-8 text-white/70" />
                      <input
                        ref={textInputRef}
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setIsTextOpen(false);
                        }}
                        className="w-full bg-transparent text-[13px] text-white/90 outline-none placeholder:text-white/35"
                        placeholder="Type a memory here..."
                      />
                      <button
                        type="submit"
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-white/10 px-4 text-[12px] font-semibold text-white/90 "
                        // makes the send button close the text inputtttttttttt    
                        // onClick={() => { 
                        //   setIsTextOpen(false);
                        //   setTextValue("");
                        // }}
                      >
                        Send
                      </button>
                    </form>
                  )}
                </div>

                {isTextOpen && (
                  <button
                    type="button"
                    aria-label="Close text"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/85 hover:bg-white/15 active:scale-[0.98]"
                    onClick={() => {
                      setIsTextOpen(false);
                      setTextValue("");
                    }}
                  >
                    <IoMdClose className="h-4 w-4" />
                  </button>
                )}

                {!isTextOpen && (
                  <button
                    type="button"
                    className={
                      screen === "live"
                        ? "inline-flex h-10 w-1/2 items-center justify-center gap-2 rounded-full bg-white/40 text-[13px] font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
                        : "inline-flex h-10 w-1/2 items-center justify-center gap-2 rounded-full text-[13px] font-medium text-white/90 hover:bg-white/5"
                    }
                    onClick={() => {
                      setIsMicEnabled(true);
                      setScreen("live");
                      setIsTextOpen(false);
                      setTextValue("");
                    }}
                  >
                    <RiVoiceAiFill className="h-4 w-4" />
                    Live
                  </button>
                )}
              </div>
            </div>

            {screen === "live" && (
              <div className="relative z-10 flex items-center justify-center gap-4">
                <button
                  type="button"
                  className={`${glassyIconButtonBase} ${glassyIconButtonHighlight} ${
                    isMicEnabled
                      ? "ring-1 ring-emerald-400/30 shadow-[0_10px_30px_rgba(16,185,129,0.18),0_0_0_1px_rgba(255,255,255,0.06)]"
                      : "ring-1 ring-rose-400/30 shadow-[0_10px_30px_rgba(244,63,94,0.16),0_0_0_1px_rgba(255,255,255,0.06)]"
                  }`}
                  aria-label="Mic"
                  onClick={() => {
                    void handleToggleMic();
                  }}
                >
                  {isMicEnabled ? (
                    <PiMicrophoneDuotone className="h-5 w-5" />
                  ) : (
                    <PiMicrophoneSlashDuotone className="h-5 w-5" />
                  )}
                </button>
                <button
                  type="button"
                  className={`${glassyIconButtonBase} ${glassyIconButtonHighlight} ring-1 ring-rose-400/30 shadow-[0_10px_30px_rgba(244,63,94,0.16),0_0_0_1px_rgba(255,255,255,0.06)]`}
                  aria-label="End"
                  onClick={() => {
                    setScreen("home");
                    setIsTextOpen(false);
                    setTextValue("");
                  }}
                >
                  <IoMdClose className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
