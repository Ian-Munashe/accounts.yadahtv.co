import React from "react";
import { TbRefresh } from "react-icons/tb";
import { MdDevices } from "react-icons/md";
import { usePathname } from "next/navigation";
import { LuLogOut, LuSettings } from "react-icons/lu";
import { Avatar, cn, Dropdown, Separator, toast } from "@heroui/react";

import { useAuthentication } from "@/hooks";
import { useGlobalState, useUserState } from "@/stores";

export const UserProfile: React.FC = () => {
  const pathname = usePathname();
  const { signOut, getUser } = useAuthentication();

  const { setIsProgress } = useGlobalState();
  const { user } = useUserState();

  const handleRefreshAccount = async () => {
    setIsProgress(true);
    const isSuccess = await getUser();
    setIsProgress(false);
    if (isSuccess) toast.success("Account refreshed successfully");
  };

  return (
    <Dropdown>
      <Dropdown.Trigger className="flex items-center gap-2 p-2 hover:bg-transparent">
        <Avatar size="sm" className="cursor-pointer transition-transform">
          <Avatar.Image src={user?.avatar} alt={user?.fullname} />
          <Avatar.Fallback>
            {user?.fullname
              .split(" ")
              .map((name) => name[0])
              .join("")}
          </Avatar.Fallback>
        </Avatar>
        <span className="hidden min-w-0 flex-col items-start sm:flex">
          <span
            className="max-w-17.5 overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap"
            title={user?.fullname}
          >
            {user!.fullname?.length > 12 ? `${user?.fullname.slice(0, 22)}...` : user?.fullname}
          </span>
          <span className="text-muted truncate text-xs">{user?.role}</span>
        </span>
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <Avatar.Image alt={user?.fullname} src={user?.avatar} />
              <Avatar.Fallback delayMs={600}>
                {user?.fullname
                  .split(" ")
                  .map((name) => name[0])
                  .join("")}
              </Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col gap-0">
              <p className="text-sm leading-5 font-medium">Signed in as</p>
              <p className="text-muted text-xs leading-none">{user?.identifier}</p>
            </div>
          </div>
        </div>
        <Dropdown.Menu aria-label="Profile Actions" className="text-foreground transition-all duration-300 ease-in-out">
          <Dropdown.Item key="refresh-account" className="text-muted" onPress={handleRefreshAccount}>
            <TbRefresh className="h-4 w-4" />
            Refresh Account
          </Dropdown.Item>
          <Dropdown.Item
            href="/"
            key="settings"
            className={cn("text-muted", {
              "bg-accent text-accent-foreground hover:bg-accent-hover": pathname === "/settings",
            })}
          >
            <LuSettings className="h-4 w-4" />
            My Profile
          </Dropdown.Item>
          <Dropdown.Item
            key="devices"
            href="/devices"
            className={cn("text-muted", {
              "bg-accent text-accent-foreground hover:bg-accent-hover": pathname === "/devices",
            })}
          >
            <MdDevices className="h-4 w-4" />
            Manage Devices
          </Dropdown.Item>
          <Separator />
          <Dropdown.Item key="logout" className="text-red-500" onPress={signOut}>
            <LuLogOut className="h-4 w-4" />
            Log Out
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
};
