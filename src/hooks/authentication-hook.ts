import { toast } from "@heroui/react";

import { useAxios } from "./axios-hook";
import { useGlobalState, useModalState, useUserState } from "@/stores";
import { deleteSession, updateSession } from "@/actions/session-action";
import { resolveLogoutDestination } from "@/actions/logout-action";
import { resumeAfterLogout } from "@/lib/sso-return";
import { getErrorMessage } from "@/lib/error-message";

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
          // Logout returns to an origin app only when that app asked for it with a live
          // returnTo; otherwise the user lands on this app's own sign-in page.
          let destination = "/signin";
          try {
            const returnTo = new URLSearchParams(window.location.search).get("returnTo");
            destination = await resolveLogoutDestination(returnTo);
          } catch {
            // A resolver failure must not block logout.
          }
          try {
            await interceptor.get("/user/signout");
          } catch {
            // Local logout and origin redirect still proceed if the API call fails.
          }
          await deleteSession();
          resumeAfterLogout(destination);
        } catch (error) {
          toast.danger(getErrorMessage(error));
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
    } catch (error) {
      toast.danger(getErrorMessage(error));
      return false;
    }
  };

  return { signOut, getUser };
};
