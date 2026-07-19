import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { ModalBackdropProps } from "@heroui/react";

interface ModalState extends IModal {
  closeModal: () => void;
  /**
   * Opens the modal with the given options.
   * @param options Partial modal options to override the default state.
   */
  showModal: (options: Partial<IModal>) => void;
}

export const useModalState = create<ModalState & ModalBackdropProps>()(
  immer((set) => {
    const initialState: IModal & { isOpen: boolean } = {
      isOpen: false,
      showCancel: true,
      title: undefined,
      description: undefined,
      confirmText: "Continue",
      status: "warning",
      onConfirm: undefined,
    };

    return {
      ...initialState,
      /**
       * Opens the modal with the provided options and sets isOpen to true.
       * @param options Partial<IModal>
       */
      showModal: (options) =>
        set((state) => {
          Object.assign(state, { ...initialState, ...options, isOpen: true });
        }),

      closeModal: () =>
        set((state) => {
          state.isOpen = false;
        }),
    };
  }),
);
