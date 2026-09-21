import { useCallback, useEffect, useState } from "react";
import { default as axiosInstance, CreateAxiosDefaults, InternalAxiosRequestConfig } from "axios";

import { useDeviceInfoState } from "@/stores";
import { deleteSession, getSession, updateSession } from "@/actions/session-action";

let isRefreshingToken: Promise<any> | null = null;

const isSignoutRequest = (config?: InternalAxiosRequestConfig) =>
  typeof config?.url === "string" && config.url.includes("/user/signout");

export const useAxios = () => {
  const deviceInfo = useDeviceInfoState();
  const { model, platform, deviceId, clientId, operatingSystem } = deviceInfo;

  const [axiosInstances, _] = useState(() => {
    const options: CreateAxiosDefaults = {
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      headers: { "Content-Type": "application/json", "X-Client-Id": clientId },
    };
    return {
      axios: axiosInstance.create(options),
      interceptor: axiosInstance.create(options),
      cancelToken: axiosInstance.CancelToken.source(),
    };
  });

  useEffect(() => {
    const headers: Record<string, string | undefined> = {
      "Content-Type": "application/json",
      "X-Client-Id": clientId,
      ...(model && { "X-Model": model }),
      ...(platform && { "X-Platform": platform }),
      ...(deviceId && { "X-Device-Id": deviceId }),
      ...(operatingSystem && { "X-Operating-System": operatingSystem }),
    };

    const filteredHeaders: Record<string, string> = Object.fromEntries(
      Object.entries(headers).filter(([_, v]) => typeof v === "string" && v !== undefined) as [string, string][],
    );

    Object.assign(axiosInstances.axios.defaults.headers.common, filteredHeaders);
    Object.assign(axiosInstances.interceptor.defaults.headers.common, filteredHeaders);
  }, [platform, model, deviceId, operatingSystem]);

  const { axios, interceptor, cancelToken } = axiosInstances;

  const refreshSessionToken = useCallback(
    async (originalRequest: InternalAxiosRequestConfig) => {
      if (!isRefreshingToken) {
        isRefreshingToken = (async () => {
          const session = await getSession();
          if (!session?.refreshToken) throw new Error("No session");

          const response = await interceptor.put("/user/refresh-token", { refreshToken: session.refreshToken });
          const { accessToken, refreshToken } = response.data;
          await updateSession({ accessToken, refreshToken });
          return accessToken;
        })();
      }

      try {
        const newAccessToken = await isRefreshingToken;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return await interceptor(originalRequest);
      } catch (error: any) {
        await deleteSession();
        const returnTo = window.location.pathname + window.location.search;
        window.location.href = `/signin?returnTo=${encodeURIComponent(returnTo)}`;
        return Promise.reject(error);
      } finally {
        isRefreshingToken = null;
      }
    },
    [interceptor],
  );

  useEffect(() => {
    const requestInterceptor = interceptor.interceptors.request.use(
      async (config) => {
        const session = await getSession();
        if (session?.accessToken) config.headers["Authorization"] = `Bearer ${session.accessToken}`;

        return config;
      },
      (error) => Promise.reject(error),
    );

    const responseInterceptor = interceptor.interceptors.response.use(
      (response) => response,
      async (error) => {
        const prevRequest = error?.config;
        const status = error?.response?.status;

        if (status === 403) {
          // A 403 means authenticated-but-forbidden. Only bounce users who cannot
          // legitimately view the page; others would land in a redirect loop.
          const onAdminRoute = ["/users", "/applications"].some((route) =>
            window.location.pathname.startsWith(route),
          );
          if (!isSignoutRequest(prevRequest) && onAdminRoute) window.location.href = "/";
          return Promise.reject(error);
        }

        if (status === 401 && prevRequest && !prevRequest._retry) {
          if (isSignoutRequest(prevRequest)) return Promise.reject(error);
          prevRequest._retry = true;
          try {
            return await refreshSessionToken(prevRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      },
    );
    return () => {
      interceptor.interceptors.request.eject(requestInterceptor);
      interceptor.interceptors.response.eject(responseInterceptor);
    };
  }, [interceptor, refreshSessionToken]);

  return { axios, interceptor, cancelToken };
};
