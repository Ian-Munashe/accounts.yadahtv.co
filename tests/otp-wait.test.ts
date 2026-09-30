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

const SERVER_NOW = 1_700_000_000_000;

describe("useOTPWaitState", () => {
  test("counts down on its own from a server-anchored deadline", async () => {
    const { useOTPWaitState } = await import("@/stores/otp-wait.state");
    useOTPWaitState.getState().begin(120, SERVER_NOW);

    expect(useOTPWaitState.getState().timer).toBe(120);
    expect(useOTPWaitState.getState().deadline).toBe(SERVER_NOW + 120_000);

    // Ticks even though no component is mounted to drive it.
    vi.advanceTimersByTime(3000);
    expect(useOTPWaitState.getState().timer).toBe(117);

    vi.advanceTimersByTime(117_000);
    expect(useOTPWaitState.getState().timer).toBe(0);
    expect(useOTPWaitState.getState().deadline).toBeNull();
  });

  test("changing the device clock cannot shorten the cooldown", async () => {
    const { useOTPWaitState } = await import("@/stores/otp-wait.state");
    useOTPWaitState.getState().begin(120, SERVER_NOW);
    vi.advanceTimersByTime(3000);

    // Jump the wall clock 10 minutes forward; the monotonic ticker must ignore it.
    vi.setSystemTime(new Date(10 * 60 * 1000));
    vi.advanceTimersByTime(1000);

    expect(useOTPWaitState.getState().timer).toBe(116);
  });

  test("resumes from the persisted server deadline after a reload", async () => {
    const first = await import("@/stores/otp-wait.state");
    first.useOTPWaitState.getState().begin(120, SERVER_NOW);
    vi.advanceTimersByTime(3000);

    // Simulate a refresh: a fresh module rehydrates the server deadline. The hook then
    // re-syncs against a server clock that has moved 30s forward.
    vi.resetModules();
    const second = await import("@/stores/otp-wait.state");
    expect(second.useOTPWaitState.getState().deadline).toBe(SERVER_NOW + 120_000);

    second.useOTPWaitState.getState().sync(SERVER_NOW + 30_000);
    expect(second.useOTPWaitState.getState().timer).toBe(90);
  });

  test("clears a deadline the server says has already elapsed", async () => {
    const { useOTPWaitState } = await import("@/stores/otp-wait.state");
    useOTPWaitState.getState().begin(120, SERVER_NOW);
    useOTPWaitState.getState().sync(SERVER_NOW + 121_000);

    expect(useOTPWaitState.getState().timer).toBe(0);
    expect(useOTPWaitState.getState().deadline).toBeNull();
  });

  test("cancel stops the countdown and clears the persisted deadline", async () => {
    const { useOTPWaitState } = await import("@/stores/otp-wait.state");
    useOTPWaitState.getState().begin(120, SERVER_NOW);
    vi.advanceTimersByTime(3000);

    useOTPWaitState.getState().cancel();

    expect(useOTPWaitState.getState().timer).toBe(0);
    expect(useOTPWaitState.getState().deadline).toBeNull();

    // The ticker is stopped, so nothing resumes, and storage is cleared.
    vi.advanceTimersByTime(5000);
    expect(useOTPWaitState.getState().timer).toBe(0);
    const persisted = JSON.parse(memory.get("otp-wait-state") ?? "{}");
    expect(persisted.state?.deadline ?? null).toBeNull();
  });
});
