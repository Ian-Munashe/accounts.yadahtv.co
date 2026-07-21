import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface GlobalState {
  isProgress?: boolean;
  setIsProgress: (isProgress: boolean) => void;
}

export const useGlobalState = create<GlobalState>()(
  immer((set) => ({
    setIsProgress: (value: boolean) =>
      set((state) => {
        state.isProgress = value;
      }),
  })),
);
