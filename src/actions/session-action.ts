"use server";

import { cookies } from "next/headers";
import { getIronSession, IronSession } from "iron-session";
import { sessionOptions } from "@/session-options";

export const getSession = async (): Promise<ISession> => {
  const cookieStore = await cookies();
  const session = await getIronSession<ISession>(cookieStore, sessionOptions);
  return JSON.parse(JSON.stringify(session));
};

export const updateSession = async ({ accessToken, refreshToken, user }: ISession): Promise<ISession> => {
  const cookieStore = await cookies();
  const session: IronSession<ISession> = await getIronSession<ISession>(cookieStore, sessionOptions);

  let changed = false;

  if (user && JSON.stringify(session.user) !== JSON.stringify(user)) {
    session.user = user;
    changed = true;
  }
  if (accessToken && session.accessToken !== accessToken) {
    session.accessToken = accessToken;
    changed = true;
  }
  if (refreshToken && session.refreshToken !== refreshToken) {
    session.refreshToken = refreshToken;
    changed = true;
  }

  if (changed) await session.save();
  return JSON.parse(JSON.stringify(session));
};

export const deleteSession = async (): Promise<void> => {
  const cookieStore = await cookies();
  const session: IronSession<ISession> = await getIronSession<ISession>(cookieStore, sessionOptions);
  session.destroy();
};
