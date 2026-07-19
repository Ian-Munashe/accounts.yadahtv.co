import React from "react";
import { Modal } from "@heroui/react";

import { OTPForm } from "../forms";

interface Props {
  isOpen: boolean;
  action: string;
  identifier: string;
  onSuccess: (value: string) => void;
  onOpenChange: (value: boolean) => void;
}

export const VerifyOTPModal: React.FC<Props> = (props) => {
  const handleOTPSuccess = (token: string) => {
    props.onSuccess(token);
    props.onOpenChange(false);
  };

  return (
    <Modal.Backdrop isOpen={props.isOpen} onOpenChange={props.onOpenChange} variant="blur">
      <Modal.Container size="sm">
        <Modal.Dialog aria-label="Add New Contact">
          <Modal.CloseTrigger className="z-50" />
          <Modal.Body className="overflow-hidden">
            <OTPForm
              showFooter={false}
              action={props.action}
              isModalContext
              identifier={props.identifier}
              onSuccess={handleOTPSuccess}
              className="bgtransparent p-0 sm:p-0 md:w-full"
            />
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
