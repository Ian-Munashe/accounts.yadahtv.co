import { Fragment } from "react";
import { format } from "date-fns";
import { MdOutlineAlternateEmail } from "react-icons/md";
import { Avatar, Button, Chip, Separator, Surface } from "@heroui/react";
import { LuCircleCheck, LuCircleX, LuClock, LuGlobe, LuPen, LuPhone, LuShield } from "react-icons/lu";

import { Utils } from "@/lib/utils";
import { permissions } from "@/permissions";

interface Props {
  user: IUser;
  onEdit: (user: IUser) => void;
}

export const UserCard: React.FC<Props> = (props) => {
  const roleClassMap: Record<IUser["role"], string> = {
    superadmin: "bg-green-500/15 text-green-700 dark:text-green-400",
    admin: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
    user: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  };

  const statusClassMap: Record<IUser["status"], string> = {
    active: "bg-green-500/15 text-green-700 dark:text-green-400",
    suspended: "bg-red-500/15 text-red-700 dark:text-red-400",
  };

  const permissionLabels = Utils.instance.valueToLabel(
    props.user?.permissions,
    permissions.flatMap((c) => c.permissions),
  ) as string[];

  return (
    <Surface variant="default" className="flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <Avatar.Image src={props.user.avatar} alt={props.user.fullname} />
          <Avatar.Fallback>{props.user.fullname.charAt(0)}</Avatar.Fallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-semibold">{props.user.fullname}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Chip size="sm" className={`capitalize ${roleClassMap[props.user.role]}`}>
              {props.user.role}
            </Chip>
            <Chip size="sm" className={`capitalize ${statusClassMap[props.user.status]}`}>
              <span className="flex items-center gap-1.5">
                {props.user.status === "active" ? (
                  <LuCircleCheck className="h-3 w-3" />
                ) : (
                  <LuCircleX className="h-3 w-3" />
                )}
                {props.user.status}
              </span>
            </Chip>
          </div>
        </div>
        <Button isIconOnly size="sm" variant="outline" fullWidth onPress={() => props.onEdit(props.user)}>
          <LuPen className="h-3 w-3" />
        </Button>
      </div>
      <Separator />
      <div className="flex flex-col gap-2 text-xs">
        <div className="flex items-center gap-2">
          <MdOutlineAlternateEmail className="text-muted h-4 w-4 shrink-0" />
          <span className="text-foreground truncate">{props.user.identifier}</span>
        </div>
        {props.user.metadata?.phone && (
          <div className="flex items-center gap-2">
            <LuPhone className="text-muted h-4 w-4 shrink-0" />
            <span className="text-foreground">+263785858682</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <LuGlobe className="text-muted h-4 w-4 shrink-0" />
          <span className="text-foreground">{Utils.instance.countryCodeToName(props.user.country)}</span>
        </div>
        <div className="flex items-center gap-2">
          <LuClock className="text-muted h-4 w-4 shrink-0" />
          <span className="text-foreground">Joined {format(props.user.createdAt, "dd MMM yyyy")}</span>
        </div>
      </div>
      <Separator />
      <div className="text-muted flex items-center gap-1 text-xs">
        <LuShield className="h-4 w-4" /> Permissions
      </div>
      {props.user.permissions.length > 0 && (
        <Fragment>
          <div>
            <div className="flex flex-wrap gap-1">
              {permissionLabels.map((label, index) => (
                <Chip key={index} size="sm" className="bg-purple-500/15 text-purple-700 dark:text-purple-400">
                  {label}
                </Chip>
              ))}
            </div>
          </div>
        </Fragment>
      )}
    </Surface>
  );
};
