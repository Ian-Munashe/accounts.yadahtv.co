"use server";

import { isAllowedSsoCallback } from "@/lib/sso-authorize";
import { originCallbackFromReturnTo } from "@/lib/sso-return";

/**
 * Resolves where the browser goes after logging out of the Account Center.
 *
 * Only a live `returnTo` on the URL that triggered logout can pull the user back to an
 * origin app, and only when that callback passes the same allowlist used to hand out SSO
 * tickets. Session state never drives this; anything else goes to the local `/signin`.
 */
export const resolveLogoutDestination = async (returnTo?: string | null): Promise<string> => {
  if (!returnTo?.trim()) return "/signin";

  const callback = originCallbackFromReturnTo(returnTo) ?? returnTo;
  return isAllowedSsoCallback(callback) ? callback : "/signin";
};
