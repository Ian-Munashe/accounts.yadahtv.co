interface IDevice {
  _id: string;
  model: string;
  userId: string;
  deviceId: string;
  platform: string;
  fcmToken?: string;
  updatedAt: string;
  createdAt: string;
  operatingSystem: string;
  lastSeen: Date;
  metadata?: Record<string, any>;
  notifications: Record<string, boolean>;
}
