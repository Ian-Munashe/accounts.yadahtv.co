import { useEffect, useState } from "react";

import { fetchServerTime } from "@/lib/server-time";
import { OTP_RESEND_WAIT_SECONDS, useOTPWaitState } from "@/stores";
import { useAxios } from "./axios-hook";

/**
 * Drives the OTP resend cooldown from the server clock.
 *
 * On mount (and whenever the tab becomes visible again) it re-syncs the persisted
 * deadline against `GET /health`, so a reload, a closed tab, or a changed device clock
 * cannot shorten the wait. `beginCountdown` is called after a code is requested.
 */
export const useOTPWait = () => {
  const { axios } = useAxios();
  const { timer, begin, sync } = useOTPWaitState();
  const [isSyncing, setIsSyncing] = useState(() => Boolean(useOTPWaitState.getState().deadline));

  useEffect(() => {
    let active = true;

    const resync = async () => {
      if (!useOTPWaitState.getState().deadline) return;
      setIsSyncing(true);
      try {
        const serverNow = await fetchServerTime(axios);
        if (active) sync(serverNow);
      } catch {
        // No server time: keep the API-side cooldown as the source of truth.
      } finally {
        if (active) setIsSyncing(false);
      }
    };

    void resync();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void resync();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [axios, sync]);

  const beginCountdown = async () => {
    try {
      begin(OTP_RESEND_WAIT_SECONDS, await fetchServerTime(axios));
    } catch {
      // Last resort when the API is unreachable: still block rapid retries locally.
      begin(OTP_RESEND_WAIT_SECONDS, Date.now());
    }
  };

  return { timer, isSyncing, beginCountdown };
};
