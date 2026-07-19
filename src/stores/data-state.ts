import { create } from "zustand";
import { AxiosInstance } from "axios";
import { toast } from "@heroui/react";
import { immer } from "zustand/middleware/immer";

type FetchOptions = {
  showLoader?: boolean;
};

interface DataState {
  page: number;
  total: number;
  data: any[];
  search: string;
  filters: string[];
  totalPages: number;
  isLoading: boolean;
  resetState: () => void;
  setPage: (page: number) => void;
  addData: (data: any) => void;
  removeData: (id: string) => void;
  setData: (data: any[]) => void;
  setFilters: (filters: string[]) => void;
  updateData: (id: string, newData: any) => void;
  fetchData: (instance: AxiosInstance, endpoint: string, options?: FetchOptions) => Promise<void>;
  setSearch: (search: string, instance: AxiosInstance, endpoint: string, options?: FetchOptions) => void;
}

const createInitialState = () => ({
  page: 1,
  total: 0,
  search: "",
  data: [],
  filters: [],
  totalPages: 0,
  isLoading: false,
});

const storeInstances = new Map<string, any>();

let debounceTimeout: NodeJS.Timeout | null = null;

export const createDataStore = (storeName: string) => {
  if (storeInstances.has(storeName)) return storeInstances.get(storeName);

  const useDataStore = create<DataState>()(
    immer((set, get) => ({
      ...createInitialState(),
      setPage: (page) => set({ page }),
      setFilters: (filters) => set({ filters }),
      resetState: () => set({ ...createInitialState() }),
      setSearch: (search, instance, endpoint, { showLoader = false } = {}) => {
        set({ search, page: 1 });
        if (debounceTimeout) clearTimeout(debounceTimeout);
        if (instance && endpoint) {
          debounceTimeout = setTimeout(() => get().fetchData(instance, endpoint, { showLoader }), 1000);
        }
      },
      fetchData: async (instance, endpoint, { showLoader = true } = {}) => {
        if (showLoader) set({ isLoading: true });
        try {
          const state = get();
          const currentPage = state.page ?? 1;
          const query = new URLSearchParams({ page: String(currentPage) });
          if (state.search.trim()) query.set("search", state.search.trim());
          if (state.filters.length > 0) {
            state.filters.forEach((filter) => {
              if (filter.includes("=")) {
                const [key, value] = filter.split("=");
                query.set(key, value);
              } else {
                const existingFilters = query.get("filters");
                query.set("filters", existingFilters ? `${existingFilters},${filter}` : filter);
              }
            });
          }
          const url = `${endpoint}?${query.toString()}`;
          const { data } = await instance.get(url);
          set({ data: data.results ?? [], total: data.total ?? 0, totalPages: data.totalPages ?? 1 });
        } catch (error: any) {
          toast.danger(error?.response?.data?.message ?? error.message);
        } finally {
          set({ isLoading: false });
        }
      },
      updateData: (id: string, newData: any) => {
        set((state: DataState) => {
          const idx = state.data.findIndex((item: any) => item._id === id);
          if (idx !== -1) state.data[idx] = { ...state.data[idx], ...newData };
        });
      },
      setData: (newData: any[]) =>
        set((state: DataState) => {
          state.data = newData;
        }),
      addData: (newData: any) =>
        set((state: DataState) => {
          state.data.unshift(newData);
        }),
      removeData: (id: string) =>
        set((state: DataState) => ({
          total: state.total - 1,
          data: state.data.filter((item: any) => item._id !== id),
        })),
    })),
  );

  storeInstances.set(storeName, useDataStore);
  return useDataStore;
};

export const useUsersStore = createDataStore("users");
