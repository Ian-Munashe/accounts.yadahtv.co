"use client";

import { Toast } from "@heroui/react";
import { useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Preloader } from "@/components/preloader";
import { getSession } from "@/actions/session-action";
import { useDeviceInfoState, useUserState } from "@/stores";
import { AlertModal, LoadingModal } from "@/components/modals";

export function Providers({ children }: { children: React.ReactNode }) {
  const { setUser } = useUserState();
  const { getDeviceInfo } = useDeviceInfoState();

  const [isLoading, setIsLoading] = useState(true);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // Cache data for 5 minutes (prevents refetching on saves)
            refetchOnWindowFocus: false, // Prevents auto-refetching when switching browser tabs
          },
        },
      }),
  );

  useEffect(() => {
    (async () => {
      const [_, session] = await Promise.all([getDeviceInfo(), getSession()]);
      if (session && session.user) setUser(session.user);
      setIsLoading(false);
    })();
  }, []);

  if (isLoading) return <Preloader />;

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <AlertModal />
        <LoadingModal />
        <Toast.Provider placement="bottom" />
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
