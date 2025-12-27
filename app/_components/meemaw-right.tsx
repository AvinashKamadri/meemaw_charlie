"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoCloseSharp, IoSparklesSharp } from "react-icons/io5";

type SuggestionEvent = {
  kind: "suggestionEvent";
  id: string;
  type: "merge_flashback" | "refine_flashback" | "revisit_memory";
  description: string;
  impact_review: string;
  related_entities: {
    people_ids: string[];
    flashback_ids: string[];
  };
};

type TraitUpdateEvent = {
  kind: "traitUpdateEvent";
  trait_key: "joy" | "sad" | "growth";
  delta: string;
  description: string;
  confidence: "low" | "medium" | "high";
};

type ClarifyingQuestionEvent = {
  kind: "clarifyingQuestionEvent";
  id: string;
  question: string;
  options: string[];
  description: string;
  related_people: string[];
  related_flashbacks: string[];
};

type NotificationEvent = SuggestionEvent | TraitUpdateEvent | ClarifyingQuestionEvent;
type ListEvent = SuggestionEvent | ClarifyingQuestionEvent;

const glassyBase =
  "relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/10 bg-transparent text-white/90 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition hover:bg-white/5 active:scale-[0.98]";
const glassyHighlight =
  "before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/14 before:to-transparent before:opacity-60";

function confidenceColor(confidence: TraitUpdateEvent["confidence"]) {
  if (confidence === "high") return "border-white/14 text-white/85";
  if (confidence === "medium") return "border-white/12 text-white/80";
  return "border-white/10 text-white/75";
}

function toastVisual(confidence: TraitUpdateEvent["confidence"]) {
  if (confidence === "high") {
    return "mmw-toast mmw-toast-high border-white/15";
  }
  if (confidence === "medium") {
    return "mmw-toast mmw-toast-medium border-white/12";
  }
  return "mmw-toast mmw-toast-low border-white/10";
}

function formatSuggestionTitle(type: SuggestionEvent["type"]) {
  if (type === "merge_flashback") return "Do you want me to merge these flashbacks?";
  if (type === "refine_flashback") return "Do you want me to refine these flashbacks?";
  return "Do you want me to revisit this memory?";
}

function SuggestionCard({ ev }: { ev: SuggestionEvent }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const actions = useMemo(
    () =>
      ev.type === "merge_flashback"
        ? ["Merge", "Review", "Ignore"]
        : ev.type === "refine_flashback"
          ? ["Refine", "Review", "Ignore"]
          : ["Revisit", "Review", "Ignore"],
    [ev.type],
  );

  return (
    <div className="px-1">
      <div className={`${glassyBase} ${glassyHighlight} px-4 py-2 text-[12px] font-semibold text-white/85`}>
        {formatSuggestionTitle(ev.type)}
      </div>
      <div className="mt-2 text-[12px] leading-5 text-white/60">{ev.impact_review}</div>

      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a}
            type="button"
            className={`${glassyBase} ${glassyHighlight} px-4 py-2 text-[12px] font-semibold text-white/85`}
            onMouseEnter={() => setHovered(a)}
            onMouseLeave={() => setHovered(null)}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="mt-2 min-h-[18px] text-[12px] text-white/55">
        {hovered ? (
          <span>
            <span className="text-white/75">{hovered}:</span> {ev.description}
          </span>
        ) : null}
      </div>

      <div className="mt-3 text-[11px] text-white/45">
        <div className="break-words">
          <span className="font-semibold text-white/55">People:</span>{" "}
          {ev.related_entities.people_ids.join(", ") || "-"}
        </div>
        <div className="mt-1 break-words">
          <span className="font-semibold text-white/55">Flashbacks:</span>{" "}
          {ev.related_entities.flashback_ids.join(", ") || "-"}
        </div>
      </div>
    </div>
  );
}

function ClarifyingQuestionCard({ ev }: { ev: ClarifyingQuestionEvent }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="px-1">
      <div className={`${glassyBase} ${glassyHighlight} px-4 py-2 text-[12px] font-semibold text-white/85`}>
        {ev.question}
      </div>
      <div className="mt-2 text-[12px] leading-5 text-white/60">Pick an option</div>

      <div className="mt-3 flex flex-wrap gap-2">
        {ev.options.map((o) => (
          <button
            key={o}
            type="button"
            className={`${glassyBase} ${glassyHighlight} px-4 py-2 text-[12px] font-semibold text-white/85`}
            onMouseEnter={() => setHovered(o)}
            onMouseLeave={() => setHovered(null)}
          >
            {o}
          </button>
        ))}
      </div>

      <div className="mt-2 min-h-[18px] text-[12px] text-white/55">
        {hovered ? (
          <span>
            <span className="text-white/75">{hovered}:</span> {ev.description}
          </span>
        ) : null}
      </div>

      <div className="mt-3 text-[11px] text-white/45">
        <div className="break-words">
          <span className="font-semibold text-white/55">People:</span>{" "}
          {ev.related_people.join(", ") || "-"}
        </div>
        <div className="mt-1 break-words">
          <span className="font-semibold text-white/55">Flashbacks:</span>{" "}
          {ev.related_flashbacks.join(", ") || "-"}
        </div>
      </div>
    </div>
  );
}

export default function MeemawRight() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [events, setEvents] = useState<ListEvent[]>([]);
  const [toast, setToast] = useState<TraitUpdateEvent | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const pushEvent = (ev: NotificationEvent) => {
    if (ev.kind === "traitUpdateEvent") {
      setToast(ev);
      setToastKey((k) => k + 1);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2600) as unknown as number;
      return;
    }
    setEvents((prev) => [ev, ...prev]);
  };

  const confettiPieces = useMemo(() => {
    if (!toast) return [];
    if (toast.confidence === "low") return [];
    const count = toast.confidence === "medium" ? 26 : 44;
    const palette =
      toast.confidence === "medium"
        ? ["#f59e0b", "#3b82f6", "#a855f7"]
        : ["#ec4899", "#60a5fa", "#34d399", "#f59e0b", "#a855f7"];

    return Array.from({ length: count }, (_, i) => {
      const seed = toastKey * 97 + i * 17;
      const r1 = Math.abs(Math.sin(seed + 1) * 10000) % 1;
      const r2 = Math.abs(Math.sin(seed + 2) * 10000) % 1;
      const r3 = Math.abs(Math.sin(seed + 3) * 10000) % 1;
      const r4 = Math.abs(Math.sin(seed + 4) * 10000) % 1;
      const left = 4 + r1 * 92;
      const dx = (r2 - 0.5) * (toast.confidence === "medium" ? 150 : 210);
      const rot = (r3 - 0.5) * 240;
      const sizeW = 3 + r1 * (toast.confidence === "medium" ? 5 : 6);
      const sizeH = 7 + r2 * (toast.confidence === "medium" ? 12 : 16);
      const delay = Math.floor(r3 * (toast.confidence === "medium" ? 420 : 520));
      const duration =
        toast.confidence === "medium" ? 1050 + Math.floor(r2 * 450) : 1250 + Math.floor(r2 * 650);
      const color = palette[i % palette.length];
      const isStar = toast.confidence === "high" ? r4 < 0.32 : r4 < 0.18;
      const rx = (r1 - 0.5) * 80;
      const ry = (r2 - 0.5) * 80;

      const w = isStar ? 10 + Math.floor(r1 * (toast.confidence === "medium" ? 4 : 7)) : sizeW;
      const h = isStar ? w : sizeH;

      return {
        key: `${toastKey}-${i}`,
        left: `${left}%`,
        dx: `${dx.toFixed(0)}px`,
        rot: `${rot.toFixed(0)}deg`,
        rx: `${rx.toFixed(0)}deg`,
        ry: `${ry.toFixed(0)}deg`,
        shape: isStar ? "star" : "paper",
        w: `${w.toFixed(0)}px`,
        h: `${h.toFixed(0)}px`,
        delay: `${delay}ms`,
        duration: `${duration}ms`,
        color,
      };
    });
  }, [toast, toastKey]);

  return (
    <div className="hidden lg:block">
      {isDrawerOpen ? (
        <div
          className="fixed inset-0 z-[9998] bg-black/0"
          onClick={() => {
            setIsDrawerOpen(false);
          }}
        />
      ) : null}

      <div className="fixed inset-y-0 right-0 z-[9999]">
        <div
          className={isDrawerOpen ? "absolute inset-y-0 right-0 w-[18px] pointer-events-none" : "absolute inset-y-0 right-0 w-[18px]"}
          onMouseEnter={() => {
            setIsDrawerOpen(true);
          }}
        />

        <div
          className={
            isDrawerOpen
              ? "absolute inset-y-0 right-0 w-[430px] translate-x-0 transition-transform duration-200 ease-out"
              : "absolute inset-y-0 right-0 w-[430px] translate-x-full transition-transform duration-200 ease-out"
          }
          onMouseEnter={() => {
            setIsDrawerOpen(true);
          }}
        >
          <div className="relative flex h-full flex-col border-l border-white/10 bg-black/70 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_90px_rgba(0,0,0,0.7)]">
                <div className="shrink-0 border-b border-white/10 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[14px] font-semibold text-white/85">Notification</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
                        aria-label="Simulate notification"
                        onClick={() => setIsModalOpen(true)}
                      >
                        <IoSparklesSharp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
                        aria-label="Close notifications"
                        onClick={() => setIsDrawerOpen(false)}
                      >
                        <IoCloseSharp className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-auto px-5 pb-24 pt-4">
                  {events.length === 0 ? (
                    <div className="mt-10 text-center text-[12px] text-white/45">
                      No notifications yet.
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {events.map((ev, idx) => {
                        const key = ev.kind === "suggestionEvent" ? `s-${ev.id}` : `c-${ev.id}`;
                        const node =
                          ev.kind === "suggestionEvent" ? (
                            <SuggestionCard ev={ev} />
                          ) : (
                            <ClarifyingQuestionCard ev={ev} />
                          );

                        return (
                          <React.Fragment key={key}>
                            {node}
                            {idx < events.length - 1 ? (
                              <div className="mx-6 my-3 h-px bg-white/10" />
                            ) : null}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>

                {toast && toast.confidence !== "low" ? (
                  <div
                    key={`confetti-${toastKey}`}
                    className="mmw-confetti-overlay pointer-events-none absolute inset-x-0 bottom-0 h-[78%] overflow-hidden"
                  >
                    {confettiPieces.map((p) => (
                      <span
                        key={p.key}
                        className={p.shape === "star" ? "mmw-confetti-piece mmw-confetti-star" : "mmw-confetti-piece"}
                        style={{
                          left: p.left,
                          width: p.w,
                          height: p.h,
                          animationDelay: p.delay,
                          animationDuration: p.duration,
                          ["--dx" as any]: p.dx,
                          ["--rot" as any]: p.rot,
                          ["--rx" as any]: p.rx,
                          ["--ry" as any]: p.ry,
                          ["--c" as any]: p.color,
                        }}
                      />
                    ))}
                  </div>
                ) : null}

                {toast ? (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
                    <div
                      className={`pointer-events-auto relative z-10 w-full overflow-hidden rounded-2xl border px-4 py-3 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.6)] ${toastVisual(
                        toast.confidence,
                      )} bg-transparent before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/14 before:to-transparent before:opacity-70`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[12px] font-semibold text-white/90">User traits updated</div>
                        </div>
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-transparent text-white/70 backdrop-blur-md transition hover:bg-white/5"
                          aria-label="Dismiss toast"
                          onClick={() => setToast(null)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
          </div>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              setIsModalOpen(false);
            }}
          />
          <div className="relative w-full max-w-[520px] rounded-3xl border border-white/10 bg-black/60 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-semibold text-white/85">Simulate notification</div>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
                  aria-label="Close"
                  onClick={() => {
                    setIsModalOpen(false);
                  }}
                >
                  ×
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-[13px] font-semibold text-white/85 transition hover:bg-white/10"
                  onClick={() => {
                    pushEvent({
                      kind: "suggestionEvent",
                      id: crypto.randomUUID(),
                      type: "merge_flashback",
                      description: "I can combine overlapping memories into one cleaner flashback.",
                      impact_review: "May reduce duplicates and improve recall continuity.",
                      related_entities: {
                        people_ids: ["p_12", "p_23"],
                        flashback_ids: ["f_91", "f_93"],
                      },
                    });
                    setIsModalOpen(false);
                  }}
                >
                  Add suggestionEvent
                </button>

                <button
                  type="button"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-[13px] font-semibold text-white/85 transition hover:bg-white/10"
                  onClick={() => {
                    pushEvent({
                      kind: "clarifyingQuestionEvent",
                      id: crypto.randomUUID(),
                      question: "Which person was present during this memory?",
                      options: ["Mom", "Dad", "Both", "Not sure"],
                      description: "This helps me attach the right people to the flashback.",
                      related_people: ["p_12", "p_23"],
                      related_flashbacks: ["f_91"],
                    });
                    setIsModalOpen(false);
                  }}
                >
                  Add clarifyingQuestionEvent
                </button>

                <button
                  type="button"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-[13px] font-semibold text-white/85 transition hover:bg-white/10"
                  onClick={() => {
                    pushEvent({
                      kind: "traitUpdateEvent",
                      trait_key: "growth",
                      delta: "+0.12 mood",
                      description: "Detected a positive reflection that indicates progress.",
                      confidence: "low",
                    });
                    setIsModalOpen(false);
                  }}
                >
                  Trigger traitUpdateEvent (low)
                </button>

                <button
                  type="button"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-[13px] font-semibold text-white/85 transition hover:bg-white/10"
                  onClick={() => {
                    pushEvent({
                      kind: "traitUpdateEvent",
                      trait_key: "growth",
                      delta: "+0.12 mood",
                      description: "Detected a positive reflection that indicates progress.",
                      confidence: "medium",
                    });
                    setIsModalOpen(false);
                  }}
                >
                  Trigger traitUpdateEvent (medium)
                </button>

                <button
                  type="button"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-[13px] font-semibold text-white/85 transition hover:bg-white/10"
                  onClick={() => {
                    pushEvent({
                      kind: "traitUpdateEvent",
                      trait_key: "growth",
                      delta: "+0.12 mood",
                      description: "Detected a positive reflection that indicates progress.",
                      confidence: "high",
                    });
                    setIsModalOpen(false);
                  }}
                >
                  Trigger traitUpdateEvent (high)
                </button>
              </div>
            </div>
        </div>
      ) : null}

      <style jsx global>{`
        .mmw-toast {
          transform: translateY(16px);
          opacity: 0;
          animation: mmwToastIn 220ms ease-out forwards;
        }
        .mmw-toast-low {
          background: transparent;
        }
        .mmw-toast-medium {
          background: transparent;
          animation: mmwToastIn 220ms ease-out forwards;
        }
        .mmw-toast-high {
          background: transparent;
          animation: mmwToastIn 220ms ease-out forwards;
        }
        @keyframes mmwToastIn {
          from {
            transform: translateY(18px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .mmw-confetti-piece {
          position: absolute;
          bottom: 0;
          border-radius: 2px;
          background: var(--c);
          box-shadow:
            0 8px 18px rgba(0, 0, 0, 0.35),
            0 0 0 1px rgba(255, 255, 255, 0.06) inset;
          opacity: 0;
          animation-name: mmwConfetti;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
          will-change: transform, opacity;
        }
        .mmw-confetti-piece::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0) 45%);
          opacity: 0.85;
        }
        .mmw-confetti-star {
          border-radius: 0;
          filter: drop-shadow(0 10px 14px rgba(0, 0, 0, 0.35));
          clip-path: polygon(
            50% 0%,
            61% 35%,
            98% 35%,
            68% 57%,
            79% 91%,
            50% 70%,
            21% 91%,
            32% 57%,
            2% 35%,
            39% 35%
          );
        }
        .mmw-confetti-overlay {
          animation: mmwConfettiFade 1700ms ease-out forwards;
        }
        @keyframes mmwConfetti {
          0% {
            transform: translate3d(0, 0, 0) rotate(var(--rot)) rotateX(var(--rx)) rotateY(var(--ry));
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--dx), -260px, 0) rotate(calc(var(--rot) + 340deg)) rotateX(var(--rx)) rotateY(var(--ry));
            opacity: 0;
          }
        }
        @keyframes mmwConfettiFade {
          0% {
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
