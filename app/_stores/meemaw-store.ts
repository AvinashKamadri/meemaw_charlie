import { create } from "zustand";

import type { VADState } from "../hooks/useEnhancedVAD";

export type MeemawScreen = "home" | "live";

export type ChatMessage = {
  id: string;
  role: "meemaw" | "user";
  text: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "meemaw",
    text: "hi im meemaw. i'm here with you — tell me what’s on your mind.",
  },
];

type MeemawState = {
  screen: MeemawScreen;
  isTextOpen: boolean;
  textValue: string;
  messages: ChatMessage[];

  isMicEnabled: boolean;
  isPaused: boolean;
  vadState: VADState;

  setScreen: (screen: MeemawScreen) => void;
  setIsTextOpen: (isTextOpen: boolean) => void;
  setTextValue: (textValue: string) => void;

  setIsMicEnabled: (isMicEnabled: boolean) => void;
  setIsPaused: (isPaused: boolean) => void;
  setVadState: (vadState: VADState) => void;

  addUserMessage: (text: string) => void;
  addMeemawMessage: (text: string) => void;
  resetMessages: () => void;
};

export const useMeemawStore = create<MeemawState>((set) => ({
  screen: "home",
  isTextOpen: false,
  textValue: "",
  messages: initialMessages,

  isMicEnabled: false,
  isPaused: false,
  vadState: "idle",

  // mic on when entering the start screen by default
  setScreen: (screen) =>
    set((state) => ({
      screen,
      isMicEnabled: screen === "home" ? false : state.isMicEnabled,
      isPaused: false,
      vadState: "idle",
    })),
  setIsTextOpen: (isTextOpen) => set({ isTextOpen }),
  setTextValue: (textValue) => set({ textValue }),

  setIsMicEnabled: (isMicEnabled) => set({ isMicEnabled }),
  setIsPaused: (isPaused) => set({ isPaused }),
  setVadState: (vadState) => set({ vadState }),

  addUserMessage: (text) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { id: `u-${Date.now()}`, role: "user", text },
      ],
    })),

  addMeemawMessage: (text) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { id: `m-${Date.now()}`, role: "meemaw", text },
      ],
    })),

  resetMessages: () => set({ messages: initialMessages }),
}));
