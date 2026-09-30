import type { AxiosInstance } from "axios";
import { describe, expect, test, vi } from "vitest";

import { fetchServerTime } from "@/lib/server-time";

const stubAxios = (data: unknown): AxiosInstance =>
  ({ get: vi.fn().mockResolvedValue({ data }) }) as unknown as AxiosInstance;

describe("fetchServerTime", () => {
  test("reads the server epoch from /health", async () => {
    const axios = stubAxios({ time: 1_700_000_000_000 });

    await expect(fetchServerTime(axios)).resolves.toBe(1_700_000_000_000);
    expect(axios.get).toHaveBeenCalledWith("/health");
  });

  test("throws when the API does not return a usable time", async () => {
    await expect(fetchServerTime(stubAxios({}))).rejects.toThrow();
    await expect(fetchServerTime(stubAxios({ time: "soon" }))).rejects.toThrow();
    await expect(fetchServerTime(stubAxios({ time: Number.NaN }))).rejects.toThrow();
  });
});
