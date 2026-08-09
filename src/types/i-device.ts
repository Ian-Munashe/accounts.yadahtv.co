interface IDevice {
  _id: string;
  model: string;
  userId: string;
  deviceId: string;
  platform: string;
  fcmToken?: string;
  updatedAt: string;
  createdAt: string;
  loggedIn?: boolean;
  operatingSystem: string;
  metadata?: Record<string, any>;
}
