"use server";

import { cookies } from "next/headers";
import { getIronSession, IronSession } from "iron-session";

import { sessionOptions } from "@/session-options";

/**
 * Retrieves the current session from cookies.
 * @returns {Promise<ISession | undefined>} The session object if it exists, otherwise undefined.
 */
export const getSession = async (): Promise<ISession> => {
  const session: ISession = await getIronSession<ISession>(await cookies(), sessionOptions);
  return JSON.parse(JSON.stringify(session));
};

/**
 * Updates the current session with new user data and token.
 * @param {ISession} sessionData - The new session data to save.
 * @returns {Promise<ISession>} The updated session object.
 */
export const updateSession = async ({ accessToken, refreshToken, user }: ISession): Promise<ISession> => {
  const session: IronSession<ISession> = await getIronSession<ISession>(await cookies(), sessionOptions);
  if (user) session.user = user;
  if (accessToken) session.accessToken = accessToken;
  if (refreshToken) session.refreshToken = refreshToken;
  await session.save();
  return JSON.parse(JSON.stringify(session));
};

/**
 * Deletes the current session and clears session cookies.
 * @returns {Promise<void>}
 */
export const deleteSession = async (): Promise<void> => {
  const session: IronSession<ISession> = await getIronSession<ISession>(await cookies(), sessionOptions);
  session.destroy();
};
