import React from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { Button, Surface, toast } from "@heroui/react";
import { MdOutlineAlternateEmail } from "react-icons/md";

import { useAxios } from "@/hooks";
import { NoData } from "../no-data";
import { useGlobalState, useModalState, useUserState } from "@/stores";

enum Action {
  CONTACT = "remove-contact",
  SWAP = "swap-identifier",
}

interface Props {
  onAddContact: () => void;
  onSwapContact: (value: string) => void;
  onRemoveContact: (value: string) => void;
}

export const ContactInfoCard: React.FC<Props> = (props) => {
  const { axios } = useAxios();
  const { user } = useUserState();
  const { showModal } = useModalState();
  const { setIsProgress } = useGlobalState();

  const contacts: string[] = user?.metadata?.contacts ?? [];

  const renderModalInfo = (contact: string, action: string): Record<string, any> => {
    switch (action) {
      case Action.CONTACT:
        return {
          title: "Remove Contact",
          description: `Are you sure you want to remove '${contact}' from your contacts? You can add it again later if needed.`,
          status: "danger",
        };

      case Action.SWAP:
        return {
          title: "Set as Primary Contact",
          description: `Are you sure you want to set '${contact}' as your primary account identifier? This will be used for logging in and receiving account notifications.`,
          status: "warning",
        };
      default:
        return {};
    }
  };

  const requestOTP = (contact: string, action: string) =>
    showModal({
      ...renderModalInfo(contact, action),
      onConfirm: async () => {
        setIsProgress(true);
        try {
          const payload = { identifier: user?.identifier, action };
          await axios.post("/otp/create", payload);
          if (action === Action.SWAP) props.onSwapContact(contact);
          if (action === Action.CONTACT) props.onRemoveContact(contact);
        } catch (error: any) {
          toast.danger(error.response?.data?.message ?? error.message);
        } finally {
          setIsProgress(false);
        }
      },
    });

  return (
    <Surface variant="default" className="rounded-2xl p-4">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <MdOutlineAlternateEmail className="text-accent w-5 h-5" />
          Contact Information
        </h2>
        <Button size="sm" variant="secondary" className="h-8 gap-1 text-xs" onPress={props.onAddContact}>
          <LuPlus className="h-3 w-3" /> Add New Contact
        </Button>
      </header>
      {contacts.length === 0 && (
        <NoData
          showIcon={false}
          title="No contact methods"
          description="Click 'Add' to save phone numbers or alternative emails."
          className="p-8"
        />
      )}
      {contacts.length > 0 && (
        <div className="flex flex-col gap-2">
          {contacts.map((contact, index) => (
            <div
              key={index}
              className="bg-default hover:bg-default-200/50 flex items-center justify-between rounded-xl border px-3.5 py-1.5 transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-muted text-[10px] tracking-wider uppercase">Contact {index + 1}</span>
                <span className="text-foreground text-sm font-medium">{contact}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Set as primary"
                  className="text-muted text-xs"
                  onPress={() => requestOTP(contact, Action.SWAP)}
                >
                  Make Primary
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  aria-label="Remove contact"
                  onClick={() => requestOTP(contact, Action.CONTACT)}
                  className="opacity-60 hover:opacity-100"
                >
                  <LuTrash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Surface>
  );
};
