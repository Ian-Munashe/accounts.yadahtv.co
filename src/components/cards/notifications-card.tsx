import React from "react";
import { Description, Surface, Switch, toast } from "@heroui/react";

import { useAxios } from "@/hooks";
import { useUserState } from "@/stores";
import { updateSession } from "@/actions/session-action";
import { PiBellSimpleRingingBold } from "react-icons/pi";

const APP_LABELS: Record<string, string> = {
  yb: "Yadah Busket Updates",
};

export const NotificationsCard: React.FC = () => {
  const { interceptor } = useAxios();
  const { user, updateUser } = useUserState();

  const notificationsMap = user?.metadata?.notifications || {};

  const handleNotificationToggle = async (appKey: string, enabled: boolean) => {
    if (!user) return;

    const updatedNotifications = { ...notificationsMap, [appKey]: enabled };
    const updatedMetadata = { ...user.metadata, notifications: updatedNotifications };

    updateUser({ metadata: updatedMetadata });

    try {
      const response = await interceptor.put("/utils/notifications-toggle", { enabled, application: appKey });
      await updateSession({ user: { ...user, metadata: updatedMetadata } });
      toast.success(response.data.message || "Notification preference updated.");
    } catch (error: any) {
      updateUser({ metadata: user.metadata });
      toast.danger(error.response?.data?.message || error.message);
    }
  };

  return (
    <Surface variant="default" className="rounded-2xl p-6">
      <header className="mb-6 space-y-1">
        <h2 className="text-foreground flex items-center gap-2 text-base font-semibold">
          <PiBellSimpleRingingBold className="text-accent h-5 w-5" />
          Notification Settings
        </h2>
        <Description>Manage your notification options below. Your preferences will be saved automatically.</Description>
      </header>
      <div className="space-y-4">
        {Object.entries(notificationsMap).map(([appKey, isEnabled]) => {
          const label = APP_LABELS[appKey] || appKey.toUpperCase();
          return (
            <div key={appKey} className="flex items-center justify-between">
              <span className="text-foreground text-sm font-medium">{label}</span>
              <Switch isSelected={Boolean(isEnabled)} onChange={(checked) => handleNotificationToggle(appKey, checked)}>
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Content>
              </Switch>
            </div>
          );
        })}
      </div>
    </Surface>
  );
};
