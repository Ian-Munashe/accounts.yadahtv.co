import { useCallback, useEffect, useState } from "react";
import { default as axiosInstance, CreateAxiosDefaults, InternalAxiosRequestConfig } from "axios";

import { useDeviceInfoState } from "@/stores";
import { deleteSession, getSession, updateSession } from "@/actions/session-action";

let isRefreshingToken: Promise<any> | null = null;

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
          if (!session) throw new Error("No session");

          const response = await interceptor.put("/user/refresh-token", { refreshToken: session.refreshToken });
          const { accessToken, refreshToken } = response.data;
          await updateSession({ accessToken, refreshToken });
          return accessToken;
        })();
      }

      try {
        const newAccessToken = await isRefreshingToken;
        isRefreshingToken = null;

        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return interceptor(originalRequest);
      } catch (error: any) {
        isRefreshingToken = null;
        await deleteSession();
        window.location.href = "/signin";
        return Promise.reject(error);
      }
    },
    [axios, interceptor],
  );

  useEffect(() => {
    const requestInterceptor = interceptor.interceptors.request.use(
      async (config) => {
        const session = await getSession();
        if (session) config.headers["Authorization"] = `Bearer ${session.accessToken}`;

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
          window.location.href = "/";
          return Promise.reject(error);
        }

        if (status === 401 && prevRequest && !prevRequest._retry) {
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
