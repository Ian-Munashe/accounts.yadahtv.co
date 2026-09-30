export {};

declare global {
  interface ISession {
    user?: IUser;
    accessToken?: string;
    refreshToken?: string;
  }
}
