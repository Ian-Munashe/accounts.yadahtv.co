import type { AxiosInstance } from "axios";

/**
 * Reads the auth API's clock (epoch ms) from `GET /health`.
 *
 * Time-sensitive UI (the OTP resend cooldown) anchors to this value instead of the
 * device clock, which the user can freely change. Throws when the API does not return
 * a usable number so callers can fall back deliberately.
 */
export const fetchServerTime = async (axios: AxiosInstance): Promise<number> => {
  const response = await axios.get<{ time?: unknown }>("/health");
  const time = response.data?.time;
  if (typeof time !== "number" || !Number.isFinite(time)) throw new Error("Server time is unavailable");
  return time;
};
