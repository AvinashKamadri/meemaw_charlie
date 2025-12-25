"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PiMicrophoneDuotone } from "react-icons/pi";
import { RiVoiceAiFill } from "react-icons/ri";
import { IoMdClose } from "react-icons/io";

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

type ChatMessage = {
  id: string;
  role: "meemaw" | "user";
  text: string;
};

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
  const [isTextOpen, setIsTextOpen] = useState(false);
  const [textValue, setTextValue] = useState("");
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const [screen, setScreen] = useState<"home" | "live">("home");
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>(() => [
    {
      id: "m1",
      role: "meemaw",
      text: "hi im meemaw. i'm here with you — tell me what’s on your mind.",
    },
  ]);

  const audioVizRef = useRef<HTMLDivElement | null>(null);
  const audioMotionRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const stride = 260 + 16;

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
    if (screen !== "live") return;

    let cancelled = false;

    const start = async () => {
      if (!audioVizRef.current) return;

      const mod: any = await import("audiomotion-analyzer");
      const AudioMotionAnalyzer = mod?.default ?? mod?.AudioMotionAnalyzer;
      if (!AudioMotionAnalyzer) return;

      const audioMotion = new AudioMotionAnalyzer(audioVizRef.current, {
        mode: 10,
        channelLayout: "single",
        colorMode: "gradient",
        fillAlpha: 0.6,
        lineWidth: 1.5,
        mirror: 0,
        reflexAlpha: 0,
        reflexBright: 0,
        reflexRatio: 0,
        showBgColor: false,
        showPeaks: false,
        showScaleX: false,
        showScaleY: false,
        smoothing: 0.7,
        minFreq: 30,
        maxFreq: 16000,
        connectSpeakers: false,
      });

      try {
        audioMotion.registerGradient("meemawBlue", {
          dir: "v",
          colorStops: [
            { color: "#60a5fa", pos: 0 },
            { color: "#2563eb", pos: 0.55 },
            { color: "#0b1b3a", pos: 1 },
          ],
        });
        audioMotion.setOptions({ gradient: "meemawBlue", gradientRight: "meemawBlue" });
      } catch {
        // ignore
      }

      audioMotionRef.current = audioMotion;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      micStreamRef.current = stream;
      if (audioMotion.audioCtx?.state === "suspended") {
        await audioMotion.audioCtx.resume();
      }

      const source = audioMotion.audioCtx.createMediaStreamSource(stream);
      micSourceRef.current = source;
      audioMotion.connectInput(source);
    };

    start().catch(() => {
      // ignore
    });

    return () => {
      cancelled = true;

      try {
        audioMotionRef.current?.disconnectInput(undefined, true);
      } catch {
        // ignore
      }

      try {
        audioMotionRef.current?.destroy();
      } catch {
        // ignore
      }

      audioMotionRef.current = null;
      micSourceRef.current = null;

      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
    };
  }, [screen]);

  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-black text-white select-none">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-black to-zinc-950" />
      <div className="pointer-events-none absolute -top-10 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl lg:left-36 lg:-translate-x-0" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-44 -right-28 h-[520px] w-[520px] rounded-full bg-rose-600/25 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[430px] lg:mx-0">
        <div className="relative flex min-h-[100dvh] flex-col box-border px-5 pb-8 pt-10">
          {screen === "home" ? (
            <>
              <section className="mt-10">
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
              <section className="mt-6">
                <div className="text-center text-[14px] font-semibold text-white/85">
                  Live
                </div>
                <div className="mx-auto mt-4 h-px w-[260px] bg-white/10" />
              </section>

              <section className="mt-6 flex min-h-0 flex-1 flex-col gap-3 overflow-auto pb-6">
                {liveMessages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      m.role === "meemaw"
                        ? "mr-10 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] leading-6 text-white/85"
                        : "ml-10 rounded-2xl bg-white/10 px-4 py-3 text-[13px] leading-6 text-white/90"
                    }
                  >
                    {m.text}
                  </div>
                ))}
              </section>
            </>
          )}

          <div className="relative mt-auto flex w-full flex-col items-center gap-4">
            {screen === "live" && (
              <div
                className="pointer-events-none absolute -left-5 -right-5 -bottom-8 z-0 h-[260px] overflow-hidden opacity-95"
                style={{
                  WebkitMaskImage:
                    "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)",
                  maskImage:
                    "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)",
                }}
                aria-hidden="true"
              >
                <div ref={audioVizRef} className="h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              </div>
            )}

            <div className="relative z-10 w-full max-w-[320px]">
              <div className="relative flex h-12 w-full items-center rounded-full border border-white/10 bg-white/5 p-1 text-white/80 backdrop-blur-md gap-2">
                <div
                  className={
                    isTextOpen
                      ? "flex w-full items-center gap-2 rounded-full bg-white/10 px-3 transition-all duration-200"
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
                        const v = textValue.trim();
                        if (!v) return;
                        if (screen === "live") {
                          setLiveMessages((prev) => [
                            ...prev,
                            { id: `u-${Date.now()}`, role: "user", text: v },
                          ]);
                        }
                        setTextValue("");
                        requestAnimationFrame(() => {
                          textInputRef.current?.focus();
                        });
                      }}
                    >
                      <IconKeyboard className="h-4 w-4 text-white/70" />
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
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-white/10 px-4 text-[12px] font-semibold text-white/90"
                      >
                        Send
                      </button>
                    </form>
                  )}
                </div>

                {!isTextOpen && (
                  <button
                    type="button"
                    className={
                      screen === "live"
                        ? "inline-flex h-10 w-1/2 items-center justify-center gap-2 rounded-full bg-white/40 text-[13px] font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
                        : "inline-flex h-10 w-1/2 items-center justify-center gap-2 rounded-full text-[13px] font-medium text-white/90 hover:bg-white/5"
                    }
                    onClick={() => {
                      setScreen("live");
                      setIsTextOpen(false);
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
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90 text-white shadow-[0_10px_30px_rgba(244,63,94,0.25)]"
                  aria-label="Mic"
                >
                  <PiMicrophoneDuotone className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90 text-white shadow-[0_10px_30px_rgba(244,63,94,0.25)]"
                  aria-label="End"
                  onClick={() => {
                    setScreen("home");
                    setIsTextOpen(false);
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
