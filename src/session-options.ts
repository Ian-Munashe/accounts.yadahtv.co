import { SessionOptions } from "iron-session";

import { Utils } from "./lib/utils";

export const sessionOptions: SessionOptions = {
  password: String(process.env.NEXT_AUTH_SECRET),
  cookieName: String(process.env.NEXT_COOKIE_NAME),
  cookieOptions: {
    httpOnly: true,
    secure: false, //TODO: This is only for testing
    // secure: process.env.NODE_ENV === "production",
    maxAge: Utils.instance.toSeconds(Utils.instance.futureDateTime("90d")),
    sameSite: "lax",
  },
};
