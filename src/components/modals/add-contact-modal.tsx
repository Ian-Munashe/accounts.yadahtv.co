import { LuCircleCheck } from "react-icons/lu";
import React, { Fragment, useState } from "react";
import { Chip, Description, Modal, Separator, toast } from "@heroui/react";

import { useAxios } from "@/hooks";
import { OTPForm, RequestCodeForm } from "../forms";
import { useGlobalState, useUserState } from "@/stores";
import { updateSession } from "@/actions/session-action";

interface Props {
  action: string;
  isOpen: boolean;
  onOpenChange: (value: boolean) => void;
}

enum Steps {
  VERIFY = "verify",
  CONTACT = "contact",
}

export const AddContactModal: React.FC<Props> = (props) => {
  const { interceptor } = useAxios();
  const { user, setUser } = useUserState();
  const { setIsProgress } = useGlobalState();

  const [identifier, setIdentifier] = useState<string>("");
  const [step, setStep] = useState<string>(Steps.CONTACT);

  const children = (
    <Fragment>
      <div className="bg-default mb-3 flex items-center justify-between rounded-xl px-4 py-3">
        <div>
          <p className="text-muted mb-0.5 text-xs">Primary Contact</p>
          <p className="text-foreground text-sm font-medium">{user?.identifier}</p>
        </div>
        <Chip size="sm" className="bg-green-500/15 text-green-700 dark:text-green-400">
          <LuCircleCheck size={12} />
          Verified
        </Chip>
      </div>
      <Separator />
    </Fragment>
  );

  const handleSuccess = async (token: string) => {
    setIsProgress(true);

    const endpointConfigs: Record<string, { method: "post" | "put"; url: string }> = {
      "add-contact": {
        method: "post",
        url: `/contacts/add?t=${token}`,
      },
      "change-identifier": {
        method: "put",
        url: `/contacts/change-identifier?t=${token}`,
      },
    };

    const config = endpointConfigs[props.action];
    if (!config) {
      setIsProgress(false);
      toast.danger(`Unknown action handler: ${props.action}`);
      return;
    }

    try {
      const response = await interceptor[config.method](config.url, {});
      const user = response.data.user;
      await updateSession({ user });
      setUser(user);
      props.onOpenChange(false);
      toast.success(response.data.message);
    } catch (error: any) {
      toast.danger(error?.response?.data?.message ?? error.message);
    } finally {
      setIsProgress(false);
    }
  };

  const renderForms = () => {
    switch (step) {
      case Steps.VERIFY:
        return (
          identifier && (
            <OTPForm
              isModalContext
              action={props.action}
              showFooter={false}
              identifier={identifier}
              onSuccess={handleSuccess}
              className="items-start p-0 sm:p-0 md:w-full"
            />
          )
        );

      default:
        return (
          <RequestCodeForm
            action={props.action}
            onSuccess={(value) => {
              setIdentifier(value);
              setStep(Steps.VERIFY);
            }}
            className="p-0 sm:p-0 md:w-full"
          >
            {children}
          </RequestCodeForm>
        );
    }
  };

  return (
    <Modal.Backdrop isOpen={props.isOpen} onOpenChange={props.onOpenChange} variant="blur">
      <Modal.Container>
        <Modal.Dialog aria-label="Add New Contact">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading slot="title">Add New Contact</Modal.Heading>
            <Description>
              Enter a new email address or phone number to add it to your account. A verification code will be sent to
              confirm the new contact.
            </Description>
          </Modal.Header>
          <Modal.Body className="overflow-hidden">{renderForms()}</Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
