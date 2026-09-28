import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const memory = new Map<string, string>();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(0));
  memory.clear();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    },
  });
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("remainingSeconds", () => {
  test("rounds up the remaining time and clamps to zero", async () => {
    const { remainingSeconds } = await import("@/stores/otp-wait.state");

    expect(remainingSeconds(null)).toBe(0);
    expect(remainingSeconds(5000, 1000)).toBe(4);
    expect(remainingSeconds(1000, 1000)).toBe(0);
    expect(remainingSeconds(999, 1000)).toBe(0);
  });
});

describe("useOTPWaitState", () => {
  test("counts down on its own and survives a page reload via the persisted expiry", async () => {
    const first = await import("@/stores/otp-wait.state");
    first.useOTPWaitState.getState().startCountdown(120);
    expect(first.useOTPWaitState.getState().timer).toBe(120);

    // Ticks even though no component is mounted to drive it.
    vi.advanceTimersByTime(3000);
    expect(first.useOTPWaitState.getState().timer).toBe(117);

    // Simulate a refresh: a fresh module rehydrates the absolute expiry from storage.
    vi.resetModules();
    const second = await import("@/stores/otp-wait.state");
    expect(second.useOTPWaitState.getState().timer).toBe(117);

    vi.advanceTimersByTime(117_000);
    expect(second.useOTPWaitState.getState().timer).toBe(0);
    expect(second.useOTPWaitState.getState().expiresAt).toBeNull();
  });
});
