"use client";

import { AxiosError } from "axios";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { useAxios } from "@/hooks";
import { useEffect } from "react";
import { toast } from "@heroui/react";

export interface PaginatedResponse<T> {
  results: T[];
  total: number;
  totalPages: number;
  page: number;
}

export interface PaginatedParams {
  page?: number;
  search?: string;
  filters?: string[];
  enabled?: boolean;
  [key: string]: any;
}

export function usePaginatedQuery<T = any>(queryKeyPrefix: string, endpoint: string, params: PaginatedParams = {}) {
  const { interceptor } = useAxios();
  const { page = 1, search = "", filters = [], enabled = true, ...extraParams } = params;

  const query = useQuery<PaginatedResponse<T>, AxiosError<{ message?: string }>>({
    queryKey: [queryKeyPrefix, { endpoint, page, search, filters, ...extraParams }],
    queryFn: async () => {
      const queryParams = new URLSearchParams({ page: String(page) });

      if (search.trim()) queryParams.set("search", search.trim());

      if (filters.length > 0) {
        filters.forEach((filter) => {
          if (filter.includes("=")) {
            const [key, value] = filter.split("=");
            queryParams.set(key, value);
          } else {
            const existing = queryParams.get("filters");
            queryParams.set("filters", existing ? `${existing},${filter}` : filter);
          }
        });
      }

      Object.entries(extraParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.set(key, String(value));
        }
      });

      const response = await interceptor.get(`${endpoint}?${queryParams.toString()}`);
      return response.data;
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      const message = query.error.response?.data?.message || query.error.message || "Failed to load data";
      toast.danger(message);
    }
  }, [query.isError, query.error]);

  return query;
}
