"use server";

import { cookies } from "next/headers";
import { getIronSession, IronSession } from "iron-session";
import { sessionOptions } from "@/session-options";

export const getSession = async (): Promise<ISession> => {
  const cookieStore = await cookies();
  const session = await getIronSession<ISession>(cookieStore, sessionOptions);
  return JSON.parse(JSON.stringify(session));
};

export const updateSession = async ({ accessToken, refreshToken, user, ssoReturnTo }: ISession): Promise<ISession> => {
  const cookieStore = await cookies();
  const session: IronSession<ISession> = await getIronSession<ISession>(cookieStore, sessionOptions);

  if (user) session.user = user;
  if (accessToken) session.accessToken = accessToken;
  if (refreshToken) session.refreshToken = refreshToken;
  if (ssoReturnTo) session.ssoReturnTo = ssoReturnTo;

  await session.save();
  return JSON.parse(JSON.stringify(session));
};

export const deleteSession = async (): Promise<void> => {
  const cookieStore = await cookies();
  const session: IronSession<ISession> = await getIronSession<ISession>(cookieStore, sessionOptions);
  session.destroy();
};
