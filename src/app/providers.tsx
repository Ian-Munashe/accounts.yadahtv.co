"use client";

import { Toast } from "@heroui/react";
import { useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { Preloader } from "@/components/preloader";
import { getSession } from "@/actions/session-action";
import { useDeviceInfoState, useUserState } from "@/stores";
import { AlertModal, LoadingModal } from "@/components/modals";

export function Providers({ children }: { children: React.ReactNode }) {
  const { setUser } = useUserState();
  const { getDeviceInfo } = useDeviceInfoState();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [_, session] = await Promise.all([getDeviceInfo(), getSession()]);
      if (session && session.user) setUser(session.user);
      setIsLoading(false);
    })();
  }, []);

  if (isLoading) return <Preloader />;

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <AlertModal />
      <LoadingModal />
      <Toast.Provider placement="bottom" />
    </NextThemesProvider>
  );
}
