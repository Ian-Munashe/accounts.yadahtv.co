interface IDevice {
  _id: string;
  model: string;
  deviceId: string;
  platform: string;
  updatedAt: string;
  createdAt: string;
  operatingSystem: string;
  metadata: Record<string, any>;
  notifications: {
    enabled: boolean;
  };
}
