import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface OTPWaitState {
  timer: number;
  startCountdown: (seconds: number) => void;
}

export const useOTPWaitState = create<OTPWaitState>()(
  persist(
    immer((set, get) => {
      let interval: NodeJS.Timeout | null = null;
      return {
        timer: 0,
        startCountdown: (seconds: number) => {
          if (interval) clearInterval(interval);
          set((state) => {
            state.timer = seconds;
          });
          interval = setInterval(() => {
            set((state) => {
              if (state.timer > 0) {
                state.timer -= 1;
              }
            });
            if (get().timer <= 0) {
              if (interval) clearInterval(interval);
              interval = null;
            }
          }, 1000);
        },
      };
    }),
    {
      name: "otp-wait-state",
      partialize: (state) => ({ timer: state.timer }),
    },
  ),
);
