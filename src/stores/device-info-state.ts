import { create } from "zustand";
import { Device } from "@capacitor/device";
import { immer } from "zustand/middleware/immer";

interface DeviceInfoStateActions {
  getDeviceInfo: () => Promise<void>;
}

export const useDeviceInfoState = create<IDeviceInfo & DeviceInfoStateActions>()(
  immer((set) => ({
    model: undefined,
    platform: undefined,
    deviceId: undefined,
    operatingSystem: undefined,
    getDeviceInfo: async () => {
      const deviceInfo = await Device.getInfo();
      const { identifier: deviceId } = await Device.getId();
      set({ deviceId, ...deviceInfo });
    },
  })),
);
