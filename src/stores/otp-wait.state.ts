import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const OTP_RESEND_WAIT_SECONDS = 120;

interface OTPWaitState {
  /**
   * Server epoch-ms at which a new code may be requested. Persisted and always
   * compared against server time, so changing the device clock cannot extend or
   * skip the cooldown. `null` means no active cooldown.
   */
  deadline: number | null;
  timer: number;
  /** Starts a cooldown of `seconds`, using the server's clock as the anchor. */
  begin: (seconds: number, serverNow: number) => void;
  /** Recomputes the remaining time from the persisted deadline and the server's clock. */
  sync: (serverNow: number) => void;
  /** Stops the cooldown and clears it (e.g. once the user is signed in). */
  cancel: () => void;
}

let interval: ReturnType<typeof setInterval> | null = null;
// The ticker measures elapsed time with `performance.now()` (monotonic) so a change
// to the device wall clock while the page is open does not affect the countdown.
let anchorPerf = 0;
let anchorRemainingMs = 0;

const stopTicker = () => {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
};

const tick = () => {
  const remainingMs = anchorRemainingMs - (performance.now() - anchorPerf);
  if (remainingMs > 0) {
    useOTPWaitState.setState({ timer: Math.ceil(remainingMs / 1000) });
    return;
  }
  useOTPWaitState.setState({ timer: 0, deadline: null });
  stopTicker();
};

const seedTicker = (remainingMs: number) => {
  stopTicker();
  if (remainingMs <= 0) return;
  anchorPerf = performance.now();
  anchorRemainingMs = remainingMs;
  interval = setInterval(tick, 1000);
};

export const useOTPWaitState = create<OTPWaitState>()(
  persist(
    immer((set, get) => ({
      deadline: null,
      timer: 0,
      begin: (seconds: number, serverNow: number) => {
        set((state) => {
          state.deadline = serverNow + seconds * 1000;
          state.timer = seconds;
        });
        seedTicker(seconds * 1000);
      },
      sync: (serverNow: number) => {
        const deadline = get().deadline;
        const remainingMs = deadline ? deadline - serverNow : 0;
        set((state) => {
          state.deadline = remainingMs > 0 ? deadline : null;
          state.timer = remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
        });
        seedTicker(remainingMs);
      },
      cancel: () => {
        set((state) => {
          state.deadline = null;
          state.timer = 0;
        });
        stopTicker();
      },
    })),
    {
      name: "otp-wait-state",
      partialize: (state) => ({ deadline: state.deadline }),
    },
  ),
);
