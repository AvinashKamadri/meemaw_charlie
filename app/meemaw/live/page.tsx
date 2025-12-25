"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type IconProps = {
  className?: string;
};

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

function IconRadio({ className }: IconProps) {
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
        d="M12 12h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M8.5 8.5a5 5 0 0 1 0 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15.5 8.5a5 5 0 0 1 0 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMicOff({ className }: IconProps) {
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
        d="M9 9v2a3 3 0 0 0 5.12 2.12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 14a3 3 0 0 0 3-3V8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 11a7 7 0 0 1-8 6.92"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 11a7 7 0 0 0 7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 18v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconEnd({ className }: IconProps) {
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
        d="M6 8l12 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18 8L6 16"
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

export default function MeemawLivePage() {
  const router = useRouter();
  const [isTextOpen, setIsTextOpen] = useState(false);
  const [textValue, setTextValue] = useState("");

  const initial = useMemo<ChatMessage[]>(
    () => [
      {
        id: "m1",
        role: "meemaw",
        text: "hi im meemaw. i'm here with you — tell me what’s on your mind.",
      },
    ],
    [],
  );

  const [messages, setMessages] = useState<ChatMessage[]>(initial);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-black to-zinc-950" />
      <div className="pointer-events-none absolute -top-10 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-44 -right-28 h-[520px] w-[520px] rounded-full bg-rose-600/25 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-5 pb-8 pt-10">
        <section className="mt-6">
          <div className="text-center text-[14px] font-semibold text-white/85">
            Live
          </div>
          <div className="mx-auto mt-4 h-px w-[260px] bg-white/10" />
        </section>

        <section className="mt-6 flex min-h-0 flex-1 flex-col gap-3 overflow-auto pb-6">
          {messages.map((m) => (
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

        <div className="mt-auto flex flex-col items-center gap-3">
          <div className="w-full max-w-[320px]">
            <div className="relative flex h-12 w-full items-center rounded-full border border-white/10 bg-white/5 p-1 text-white/80 backdrop-blur-md">
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
                      setMessages((prev) => [
                        ...prev,
                        { id: `u-${Date.now()}`, role: "user", text: v },
                      ]);
                      setTextValue("");
                      setIsTextOpen(false);
                    }}
                  >
                    <IconKeyboard className="h-4 w-4 text-white/70" />
                    <input
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
                  className="inline-flex h-10 w-1/2 items-center justify-center gap-2 rounded-full text-[13px] font-medium text-white/90 hover:bg-white/5"
                  onClick={() => router.push("/meemaw/live")}
                >
                  <IconRadio className="h-4 w-4" />
                  Live
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90 text-white shadow-[0_10px_30px_rgba(244,63,94,0.25)]"
              aria-label="Mic"
            >
              <IconMicOff className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90 text-white shadow-[0_10px_30px_rgba(244,63,94,0.25)]"
              aria-label="End"
              onClick={() => router.push("/meemaw")}
            >
              <IconEnd className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
