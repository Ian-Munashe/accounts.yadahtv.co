import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const OTP_RESEND_WAIT_SECONDS = 120;

interface OTPWaitState {
  // Absolute epoch-ms when the resend cooldown ends. Persisted so a refresh
  // cannot reset the countdown; `null` means no active cooldown.
  expiresAt: number | null;
  timer: number;
  startCountdown: (seconds: number) => void;
}

export const remainingSeconds = (expiresAt: number | null, now: number = Date.now()): number =>
  expiresAt && expiresAt > now ? Math.ceil((expiresAt - now) / 1000) : 0;

let interval: ReturnType<typeof setInterval> | null = null;

const stopTicker = () => {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
};

const tick = () => {
  const expiresAt = useOTPWaitState.getState().expiresAt;
  const timer = remainingSeconds(expiresAt);
  useOTPWaitState.setState({ timer, expiresAt: timer > 0 ? expiresAt : null });
  if (timer <= 0) stopTicker();
};

const startTicker = (expiresAt: number | null) => {
  stopTicker();
  if (remainingSeconds(expiresAt) > 0) interval = setInterval(tick, 1000);
};

export const useOTPWaitState = create<OTPWaitState>()(
  persist(
    immer((set) => ({
      expiresAt: null,
      timer: 0,
      startCountdown: (seconds: number) => {
        const expiresAt = Date.now() + seconds * 1000;
        set((state) => {
          state.expiresAt = expiresAt;
          state.timer = seconds;
        });
        startTicker(expiresAt);
      },
    })),
    {
      name: "otp-wait-state",
      partialize: (state) => ({ expiresAt: state.expiresAt }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const timer = remainingSeconds(state.expiresAt);
        state.timer = timer;
        if (timer <= 0) state.expiresAt = null;
        startTicker(state.expiresAt);
      },
    },
  ),
);
