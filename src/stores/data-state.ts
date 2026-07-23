import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface DataState {
  page: number;
  search: string;
  filters: string[];
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setFilters: (filters: string[]) => void;
  resetState: () => void;
}

const createInitialState = () => ({
  page: 1,
  search: "",
  filters: [],
});

const stateInstances = new Map<string, any>();

export const createDataState = (stateName: string) => {
  if (stateInstances.has(stateName)) return stateInstances.get(stateName);

  const useDataStore = create<DataState>()(
    immer((set) => ({
      ...createInitialState(),
      setPage: (page) => set({ page }),
      setFilters: (filters) => set({ filters }),
      setSearch: (search) => set({ search, page: 1 }),
      resetState: () => set({ ...createInitialState() }),
    })),
  );

  stateInstances.set(stateName, useDataStore);
  return useDataStore;
};

export const useUsersListState = createDataState("users-list");
