import { SessionOptions } from "iron-session";

import { Utils } from "./lib/utils";

export const sessionOptions: SessionOptions = {
  password: String(process.env.NEXT_AUTH_SECRET),
  cookieName: String(process.env.NEXT_COOKIE_NAME),
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    // Long enough to stay signed in comfortably, short enough that a stolen cookie
    // does not remain valid for a quarter of a year. The session is refreshed on
    // each write, so active users are unaffected.
    maxAge: Utils.instance.toSeconds(Utils.instance.futureDateTime("30d")),
  },
};
