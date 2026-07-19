import { LuUser } from "react-icons/lu";
import { MdDevices } from "react-icons/md";
import { RiApps2AiLine } from "react-icons/ri";
import { PiUsersThreeBold } from "react-icons/pi";

export const menuItems: INavigationItem[] = [
  { label: "Profile", href: "/", icon: <LuUser className="h-5 w-5" /> },
  { label: "Devices", href: "/devices", icon: <MdDevices className="h-5 w-5" /> },
  { label: "Applications", href: "/applications", icon: <RiApps2AiLine className="h-5 w-5" />, roles: ["superadmin"] },
  {
    label: "Users",
    href: "/users",
    icon: <PiUsersThreeBold className="h-5 w-5" />,
    roles: ["superadmin", "admin"],
  },
];
