import { SessionOptions } from "iron-session";

import { Utils } from "./lib/utils";

const isHttps = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ?? false;

export const sessionOptions: SessionOptions = {
  password: String(process.env.NEXT_AUTH_SECRET),
  cookieName: String(process.env.NEXT_COOKIE_NAME),
  cookieOptions: {
    httpOnly: true,
    secure: isHttps, //TODO: This is only for testing
    // secure: process.env.NODE_ENV === "production",
    maxAge: Utils.instance.toSeconds(Utils.instance.futureDateTime("90d")),
    sameSite: "lax",
  },
};
