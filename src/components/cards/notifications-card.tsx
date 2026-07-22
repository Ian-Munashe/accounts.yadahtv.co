import React from "react";
import { Description, Surface, Switch, toast } from "@heroui/react";

import { useAxios } from "@/hooks";
import { useUserState } from "@/stores";
import { updateSession } from "@/actions/session-action";
import { PiBellSimpleRingingBold } from "react-icons/pi";

export const NotificationsCard: React.FC = () => {
  const { interceptor } = useAxios();
  const { user, updateUser } = useUserState();

  const handleNotificationToggle = async (notification: boolean) => {
    if (!user) return;

    const updatedMetadata = { ...user.metadata, notifications: notification };
    updateUser({ metadata: updatedMetadata });

    try {
      const response = await interceptor.put("/utils/notifications-toggle", { notification });
      await updateSession({ user: { ...user, metadata: updatedMetadata } });
      toast.success(response.data.message);
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
      <div className="flex items-center justify-between">
        <span>Receive Updates</span>
        <Switch isSelected={user?.metadata?.notifications} onChange={handleNotificationToggle}>
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      </div>
    </Surface>
  );
};
