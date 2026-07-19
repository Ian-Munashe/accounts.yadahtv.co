import React from "react";
import { Modal, Spinner } from "@heroui/react";

import { useGlobalState } from "@/stores";

export const LoadingModal: React.FC = () => {
  const { isProgress } = useGlobalState();

  return (
    <Modal.Backdrop
      isOpen={isProgress}
      isDismissable={false}
      isKeyboardDismissDisabled
      aria-label="progress"
      className="bg-transparent shadow-none"
    >
      <Modal.Container size="xs" placement="center">
        <Modal.Dialog aria-label="loading" className="border-none bg-transparent shadow-none">
          <Modal.Body className="flex flex-col items-center justify-center overflow-hidden p-1">
            <Spinner size="lg" />
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
