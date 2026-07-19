"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Button, cn, Drawer, Link } from "@heroui/react";

interface Props {
  isOpen: boolean;
  items: INavigationItem[];
  onOpenChange: (value: boolean) => void;
}

export const MobileDrawer: React.FC<Props> = (props) => {
  const pathname = usePathname();

  return (
    <Drawer isOpen={props.isOpen} onOpenChange={props.onOpenChange}>
      <Drawer.Backdrop isDismissable={false} variant="blur" className="z-9999">
        <Drawer.Content placement="left">
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>Menu</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body className="space-y-2">
              {props.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link href={item.href} key={item.label} className="w-full no-underline">
                    <Button fullWidth variant="ghost" className={cn("flex justify-start", { "bg-accent": isActive })}>
                      {item.icon}
                      <span className="text-sm font-medium">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
};
