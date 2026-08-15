interface ISession {
  user?: IUser;
  accessToken?: string;
  refreshToken?: string;
  ssoReturnTo?: string;
}
