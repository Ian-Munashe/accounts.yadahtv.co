"use client";

import { useModalState } from "@/stores";
import { Button, Modal } from "@heroui/react";

const statusConfigs = {
  warning: {
    strokeColor: "#D97706", // Amber-600 Amber-100 (light bg)
    path: (
      <path
        d="M30 27.2498V29.9998V27.2498ZM30 35.4999H30.0134H30ZM20.6914 41H39.3086C41.3778 41 42.6704 38.7078 41.6358 36.8749L32.3272 20.3747C31.2926 18.5418 28.7074 18.5418 27.6728 20.3747L18.3642 36.8749C17.3296 38.7078 18.6222 41 20.6914 41Z"
        stroke="#D97706"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  danger: {
    strokeColor: "#DC2626", // Red-600
    path: (
      <path
        d="M21 21L39 39M39 21L21 39"
        stroke="#DC2626"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  success: {
    strokeColor: "#16A34A", // Green-600
    path: <path d="M20 30L27 37L40 23" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />,
  },
};

export const AlertModal: React.FC = () => {
  const { isOpen, title, status, description, showCancel, confirmText, onConfirm, closeModal } = useModalState();

  const currentStatus = status || "warning";
  const config = statusConfigs[currentStatus as keyof typeof statusConfigs] || statusConfigs.warning;

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={closeModal}
      isDismissable={!showCancel}
      isKeyboardDismissDisabled
      variant="blur"
    >
      <Modal.Container size="sm">
        <Modal.Dialog aria-label="alert">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
              <svg width={60} height={60} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect opacity="0.1" width={60} height={60} rx={30} fill={config.strokeColor} />
                {config.path}
              </svg>
            </Modal.Icon>
            <Modal.Heading slot="title">{title}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="p-1">
            <p>{description}</p>
          </Modal.Body>
          <Modal.Footer>
            {showCancel && (
              <Button slot="close" variant="ghost">
                Cancel
              </Button>
            )}
            <Button
              onPress={async () => {
                await onConfirm?.();
                closeModal();
              }}
            >
              {confirmText}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
