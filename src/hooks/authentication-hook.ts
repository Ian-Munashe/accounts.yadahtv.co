import { toast } from "@heroui/react";

import { useAxios } from "./axios-hook";
import { useGlobalState, useModalState, useUserState } from "@/stores";
import { deleteSession, getSession, updateSession } from "@/actions/session-action";
import { resumeAfterLogout } from "@/lib/sso-return";

export const useAuthentication = () => {
  const { interceptor } = useAxios();
  const { setUser } = useUserState();
  const { showModal } = useModalState();
  const { setIsProgress } = useGlobalState();

  const signOut = () =>
    showModal({
      title: "Signout From Your Account",
      description: "Are you sure you want to sign out? You will need to sign back in to access all apps.",
      status: "danger",
      onConfirm: async () => {
        setIsProgress(true);
        try {
          const session = await getSession();
          const ssoReturnTo = session.ssoReturnTo;
          await interceptor.get("/user/signout");
          await deleteSession();
          resumeAfterLogout(ssoReturnTo);
        } catch (error: any) {
          toast.danger(error.response?.data?.message || error.message);
        } finally {
          setIsProgress(false);
        }
      },
    });

  const getUser = async (): Promise<boolean> => {
    try {
      const response = await interceptor.get("/user");
      const user: IUser = response.data;
      await updateSession({ user });
      setUser(user);
      return true;
    } catch (error: any) {
      toast.danger(error.response?.data?.message || error.message);
      return false;
    }
  };

  return { signOut, getUser };
};
