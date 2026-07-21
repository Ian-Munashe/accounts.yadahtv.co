"use client";

import { toast } from "@heroui/react";
import { Fragment, useState } from "react";

import { useAxios } from "@/hooks";
import { BreadCrumb } from "@/components/bread-crumb";
import { useGlobalState, useUserState } from "@/stores";
import { updateSession } from "@/actions/session-action";
import { AddContactModal, VerifyOTPModal } from "@/components/modals";
import { AccountInfoCard, PersonalInfoCard, ProfileCard, ContactInfoCard, NotificationsCard } from "@/components/cards";

enum OTPAction {
  ADD_CONTACT = "add-contact",
  REMOVE_CONTACT = "remove-contact",
  SWAP_IDENTIFIER = "swap-identifier",
  VERIFY_IDENTIFIER = "verify-current-contact",
}

export default function ProfilePage() {
  const { interceptor } = useAxios();
  const { user, setUser } = useUserState();
  const { setIsProgress } = useGlobalState();

  const [contact, setContact] = useState("");
  const [action, setAction] = useState<OTPAction>();
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [addContactModalOpen, setAddContactModalOpen] = useState(false);

  const openAddContactModal = () => setAddContactModalOpen(true);

  const handleContactAction = async (token: string) => {
    if (!action || action === OTPAction.ADD_CONTACT) return;
    if (action === OTPAction.VERIFY_IDENTIFIER) {
      setAction("change-identifier" as OTPAction);
      return setAddContactModalOpen(true);
    }

    setIsProgress(true);
    const actionConfigs = {
      [OTPAction.REMOVE_CONTACT]: {
        method: "post" as const,
        url: `/contacts/remove?t=${token}`,
        payload: { contact },
        successMessage: `Contact '${contact}' has been successfully removed`,
      },
      [OTPAction.SWAP_IDENTIFIER]: {
        method: "put" as const,
        url: `/contacts/swap?t=${token}`,
        payload: { identifier: contact },
        successMessage: `Contact '${contact}' has been set as your primary account identifier`,
      },
    };

    const config = actionConfigs[action];

    try {
      const response = await interceptor[config.method](config.url, config.payload);
      const newUser = response.data;

      await updateSession({ user: newUser });
      setUser(newUser);
      toast.success(config.successMessage);
    } catch (error: any) {
      toast.danger(error.response?.data?.message || error.message);
    } finally {
      setIsProgress(false);
    }
  };

  return (
    <Fragment>
      <div className="space-y-8">
        <BreadCrumb
          title="Profile Overview"
          description="Review and update your contact details, account info, and notification preferences."
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6">
            <ProfileCard />
            <AccountInfoCard
              onAddNewContact={openAddContactModal}
              onChangeIdentifier={(value) => {
                setAction(value as OTPAction);
                setOtpModalOpen(true);
              }}
            />
          </div>
          <div className="flex flex-col gap-6 lg:col-span-2">
            <ContactInfoCard
              onAddContact={() => {
                setAction(OTPAction.ADD_CONTACT);
                openAddContactModal();
              }}
              onSwapContact={(value) => {
                setContact(value);
                setAction(OTPAction.SWAP_IDENTIFIER);
                setOtpModalOpen(true);
              }}
              onRemoveContact={(value) => {
                setContact(value);
                setAction(OTPAction.REMOVE_CONTACT);
                setOtpModalOpen(true);
              }}
            />
            <PersonalInfoCard />
            <NotificationsCard />
          </div>
        </div>
      </div>
      {addContactModalOpen && (
        <AddContactModal action={action as string} isOpen={addContactModalOpen} onOpenChange={setAddContactModalOpen} />
      )}
      {user && action && otpModalOpen && (
        <VerifyOTPModal
          action={action}
          isOpen={otpModalOpen}
          identifier={user?.identifier}
          onOpenChange={setOtpModalOpen}
          onSuccess={handleContactAction}
        />
      )}
    </Fragment>
  );
}
