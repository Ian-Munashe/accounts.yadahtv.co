import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface GlobalState {
  isProgress?: boolean;
  setIsProgress: (isProgress: boolean) => void;
}

export const useGlobalState = create<GlobalState>()(
  immer((set) => ({
    setIsProgress: (isProgress: boolean) =>
      set((state) => {
        state.isProgress = isProgress;
      }),
  })),
);
