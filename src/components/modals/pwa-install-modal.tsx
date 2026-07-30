"use client";

import { LuDownload } from "react-icons/lu";
import { Button, Modal, Description } from "@heroui/react";

import { usePWAInstall } from "@/hooks";

export const PWAInstallModal: React.FC = () => {
  const { isOpen, isInstalled, install, close } = usePWAInstall();

  if (isInstalled) return null;

  return (
    <Modal.Backdrop variant="blur" isOpen={isOpen} onOpenChange={close} isDismissable={false} isKeyboardDismissDisabled>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-emerald-400">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                <LuDownload className="h-5 w-5" />
              </div>
              <div>
                <Modal.Heading slot="title">Install Console App</Modal.Heading>
                <Description>Add this app to your home screen</Description>
              </div>
            </div>
          </Modal.Header>
          <Modal.Body className="p-1">
            <Description>
              Install the Heart Stadium Console app on your device for faster access, offline capability, and an improved experience.
            </Description>
            <div className="border-border mt-4 rounded-lg border p-4">
              <ul className="text-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span>Easy access directly from your home screen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span>Available offline</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span>Loads faster than the website</span>
                </li>
              </ul>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={close}>
              Remind Me Later
            </Button>
            <Button onPress={install}>
              <LuDownload className="h-4 w-4" />
              Install App
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
