import { Fragment } from "react";
import { format } from "date-fns";
import { MdOutlineAlternateEmail } from "react-icons/md";
import { Button, Separator, Surface, toast } from "@heroui/react";
import { LuLogOut, LuPen, LuPhone, LuShield } from "react-icons/lu";

import { useAuthentication, useAxios } from "@/hooks";
import { useModalState, useGlobalState, useUserState } from "@/stores";

interface Props {
  onAddNewContact: () => void;
  onChangeIdentifier: (action: string) => void;
}

export const AccountInfoCard: React.FC<Props> = (props) => {
  const action = "verify-current-contact";
  const { axios } = useAxios();
  const { user } = useUserState();
  const { signOut } = useAuthentication();
  const { setIsProgress } = useGlobalState();
  const { showModal, closeModal } = useModalState();

  const requestOTP = () =>
    showModal({
      title: "Change Primary Contact",
      description: `Are you sure you want to change your primary account identifier? This will be used for logging in and receiving account notifications.`,
      status: "warning",
      onConfirm: () => {
        closeModal();
        setIsProgress(true);
        (async () => {
          try {
            const payload = { identifier: user?.identifier, action };
            await axios.post("/otp/create", payload);
            props.onChangeIdentifier(action);
          } catch (error: any) {
            toast.danger(error.response?.data?.message ?? error.message);
          } finally {
            setIsProgress(false);
          }
        })();
      },
    });

  return (
    <Fragment>
      <Surface variant="default" className="flex flex-col gap-4 rounded-2xl p-6">
        <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <LuShield size={16} className="text-accent" />
          Account Info
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted text-xs">Account ID</span>
            <span className="text-foreground bg-default rounded px-2 py-0.5 font-mono text-xs">
              …{user?._id.slice(-8)}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted text-xs">Member Since</span>
            <span className="text-foreground text-xs">{format(String(user?.createdAt), "MMM yyyy")}</span>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <p className="text-muted text-xs font-medium">Contacts</p>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <MdOutlineAlternateEmail className="h-4 w-4" /> Change Primary Contact
            </span>
            <Button isIconOnly size="sm" variant="ghost" onPress={requestOTP}>
              <LuPen className="text-muted h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <LuPhone className="h-4 w-4" /> Add New Contact
            </span>
            <Button isIconOnly size="sm" variant="ghost" onPress={props.onAddNewContact}>
              <LuPen className="text-muted h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <Button size="sm" fullWidth className="mt-2 bg-orange-500" onPress={signOut}>
          <LuLogOut className="h-4 w-4" /> Sign Out
        </Button>
      </Surface>
    </Fragment>
  );
};
