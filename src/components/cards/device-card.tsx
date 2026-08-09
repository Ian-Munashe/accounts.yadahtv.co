import React from "react";
import { Surface, Chip, Separator, Button, Spinner } from "@heroui/react";
import { LuCircleCheck, LuLogIn, LuLogOut, LuTrash2, LuSmartphone, LuGlobe, LuMonitor, LuTablet } from "react-icons/lu";

import { useDeviceInfoState } from "@/stores";

interface Props {
  device: IDevice;
  isRemovingDevice?: boolean;
  isSigningOutDevice?: boolean;
  onRemove: (value: IDevice) => void;
  onSignOut?: (value: IDevice) => void;
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  const size = 22;
  const cls = "text-accent";
  switch (platform.toLowerCase()) {
    case "ios":
    case "android":
      return <LuSmartphone size={size} className={cls} />;
    case "web":
      return <LuGlobe size={size} className={cls} />;
    case "desktop":
      return <LuMonitor size={size} className={cls} />;
    default:
      return <LuTablet size={size} className={cls} />;
  }
};

export const DeviceCard: React.FC<Props> = (props) => {
  const { deviceId } = useDeviceInfoState();

  const device = props.device;
  const isCurrent = device.deviceId === deviceId;
  const isLoggedIn = Boolean(device.loggedIn);

  return (
    <Surface
      variant="default"
      className={`flex flex-col gap-4 rounded-2xl p-5 ${isCurrent ? "ring-accent/30 ring-1" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-default rounded-xl p-2.5">
            <PlatformIcon platform={device.platform} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-foreground text-sm font-semibold">{device.model}</p>
              {isCurrent && (
                <Chip size="sm" className="bg-green-500/15 text-green-700 dark:text-green-400">
                  <span className="flex items-center gap-1">
                    <LuCircleCheck size={12} /> This device
                  </span>
                </Chip>
              )}
            </div>
            <p className="text-muted mt-0.5 text-xs capitalize">
              {device.platform} · {device.operatingSystem}
            </p>
          </div>
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted">Status</p>
          <div className="mt-0.5 flex items-center gap-1">
            {isLoggedIn ? (
              <LuLogIn size={12} className="text-green-600 dark:text-green-400" />
            ) : (
              <LuLogOut size={12} className="text-muted" />
            )}
            <p className={isLoggedIn ? "text-green-700 dark:text-green-400" : "text-foreground"}>
              {isLoggedIn ? "Logged in" : "Logged out"}
            </p>
          </div>
        </div>
        <div>
          <p className="text-muted">Device ID</p>
          <p className="text-foreground mt-0.5 truncate font-mono">{device.deviceId.slice(0, 12)}…</p>
        </div>
      </div>
      <Separator />
      <div className="flex justify-end gap-2">
        {isLoggedIn && props.onSignOut && (
          <Button
            size="sm"
            isIconOnly
            isDisabled={isCurrent}
            isPending={props.isSigningOutDevice}
            onPress={() => props.onSignOut?.(device)}
            className="flex items-center gap-2 bg-amber-600 disabled:bg-muted/20"
          >
            {({ isPending }) => (isPending ? <Spinner size="sm" color="current" /> : <LuLogOut />)}
          </Button>
        )}
        <Button
          isIconOnly
          size="sm"
          isDisabled={isCurrent}
          isPending={props.isRemovingDevice}
          onPress={() => props.onRemove(device)}
          className="disabled:bg-muted/20"
        >
          {({ isPending }) => (isPending ? <Spinner size="sm" color="current" /> : <LuTrash2 />)}
        </Button>
      </div>
    </Surface>
  );
};
