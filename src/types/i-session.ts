export {};

declare global {
  interface ISession {
    user?: IUser;
    accessToken?: string;
    refreshToken?: string;
    ssoReturnTo?: string;
    /** True only after a completed SSO handshake linked this session to an external app. */
    ssoOrigin?: boolean;
  }
}
