import { format } from "date-fns";
import { Fragment, useState } from "react";
import { Button, Chip, Separator, Spinner, Surface, toast } from "@heroui/react";
import {
  LuCode,
  LuGlobe,
  LuAppWindow,
  LuCopy,
  LuKey,
  LuPen,
  LuShieldCheck,
  LuTrash2,
  LuSmartphone,
  LuMonitor,
} from "react-icons/lu";

const typeClassMap: Record<IApplication["type"], string> = {
  web: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  mobile: "bg-green-500/15 text-green-700 dark:text-green-400",
  api: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  desktop: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
};

const TypeIcon = ({ type }: { type: IApplication["type"] }) => {
  const cls = "text-accent";
  const size = 20;
  switch (type) {
    case "web":
      return <LuGlobe size={size} className={cls} />;
    case "mobile":
      return <LuSmartphone size={size} className={cls} />;
    case "api":
      return <LuCode size={size} className={cls} />;
    case "desktop":
      return <LuMonitor size={size} className={cls} />;
    default:
      return <LuAppWindow size={size} className={cls} />;
  }
};

interface Props {
  application: IApplication;
  isDeleting?: boolean;
  onEdit: (value: IApplication) => void;
  onDelete: (value: IApplication) => void;
}

export const ApplicationCard: React.FC<Props> = (props) => {
  const [showToken, setShowToken] = useState(false);

  const copyToken = () => {
    navigator.clipboard.writeText(props.application.token);
    toast.success("Token copied to clipboard!");
  };

  return (
    <Surface variant="default" className="flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="bg-default rounded-xl p-2.5">
          <TypeIcon type={props.application.type} />
        </div>
        <div>
          <p className="text-foreground text-sm font-semibold">{props.application.clientId}</p>
          <Chip size="sm" className={`mt-1 capitalize ${typeClassMap[props.application.type]}`}>
            {props.application.type}
          </Chip>
        </div>
      </div>
      <Separator />
      <div>
        <p className="text-muted mb-1.5 flex items-center gap-1 text-xs">
          <LuKey size={11} /> API Token
        </p>
        <div className="flex items-center gap-2">
          <p className="text-foreground bg-default flex-1 overflow-hidden rounded-lg px-3 py-1.5 font-mono text-xs text-ellipsis whitespace-nowrap">
            {showToken ? props.application.token : "••••••••••••••••••••••"}
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowToken((v) => !v)}
            className="text-muted hover:text-foreground shrink-0 text-xs transition-colors"
          >
            {showToken ? "Hide" : "Show"}
          </Button>
          <Button isIconOnly size="sm" variant="ghost" className="text-muted" onPress={copyToken}>
            <LuCopy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div>
        <p className="text-muted mb-2 flex items-center gap-1 text-xs">
          <LuShieldCheck size={11} /> Permissions
        </p>
        <div className="flex flex-wrap gap-1.5">
          {props.application.permissions.map((perm) => (
            <Chip key={perm} size="sm" className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400">
              {perm}
            </Chip>
          ))}
        </div>
      </div>
      <Separator />
      <p className="text-muted text-xs">Created {format(props.application.createdAt, "dd MMM yyyy")}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" fullWidth onPress={() => props.onEdit(props.application)}>
          <LuPen className="h-3 w-3" /> Edit
        </Button>
        <Button
          size="sm"
          fullWidth
          isPending={props.isDeleting}
          onPress={() => props.onDelete(props.application)}
          className="bg-red-600"
        >
          {({ isPending }) =>
            isPending ? (
              <Fragment>
                <Spinner size="sm" color="warning" /> Deleting
              </Fragment>
            ) : (
              <Fragment>
                <LuTrash2 className="h-3 w-3" /> Delete
              </Fragment>
            )
          }
        </Button>
      </div>
    </Surface>
  );
};
