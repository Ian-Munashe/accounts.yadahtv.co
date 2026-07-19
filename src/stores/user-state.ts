import { create } from "zustand";

import { immer } from "zustand/middleware/immer";

interface UserState {
  user?: IUser;
  removeUser: () => void;
  setUser: (user: IUser) => void;
  updateUser: (partialUser: Partial<IUser>) => void;
}

export const useUserState = create<UserState>()(
  immer((set) => ({
    removeUser: () => set({ user: undefined }),
    setUser: (user) => set({ user }),
    updateUser: (partialUser: Partial<IUser>) =>
      set((state) => {
        if (!state.user) return {};
        return { user: { ...state.user, ...partialUser } };
      }),
  })),
);
