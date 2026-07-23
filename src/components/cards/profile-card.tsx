import React from "react";
import { LuCamera } from "react-icons/lu";
import { Avatar, Button, Chip, Surface } from "@heroui/react";

import { useUserState } from "@/stores";

export const ProfileCard: React.FC = () => {
  const { user } = useUserState();

  const roleClassMap: Record<string, string> = {
    user: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
    admin: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
    superadmin: "bg-green-500/15 text-green-700 dark:text-green-400",
  };

  return (
    <Surface variant="default" className="flex flex-col items-center gap-4 rounded-2xl p-6">
      <div className="relative">
        <Avatar className="h-24 w-24 text-2xl">
          <Avatar.Image src={user?.avatar} alt={user?.fullname} />
          <Avatar.Fallback className="text-xl">
            {user?.fullname
              .split(" ")
              .map((name) => name[0])
              .join("")}
          </Avatar.Fallback>
        </Avatar>
        <Button isIconOnly className="absolute -right-2 -bottom-2">
          <LuCamera size={14} />
        </Button>
      </div>
      <div className="text-center">
        <p className="text-foreground text-lg font-semibold">{user?.fullname}</p>
        <p className="text-muted text-sm">{user?.identifier}</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <Chip
            size="sm"
            className={`lowercase ${roleClassMap[user?.role!] ?? "bg-purple-500/15 text-purple-700 dark:text-purple-400"}`}
          >
            {user?.role}
          </Chip>
          {user?.metadata?.codename && (
            <Chip size="sm" className="bg-blue-500/15 font-medium text-blue-700 dark:text-blue-400">
              🚩 {user.metadata.codename}
            </Chip>
          )}
        </div>
      </div>
    </Surface>
  );
};
