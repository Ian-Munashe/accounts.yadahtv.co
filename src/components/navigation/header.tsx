"use client";

import { useState } from "react";
import { IoMdMore } from "react-icons/io";
import { CgMenuRight } from "react-icons/cg";
import { usePathname } from "next/navigation";
import { Button, cn, Dropdown, Label, Link } from "@heroui/react";

import { useUserState } from "@/stores";
import { menuItems } from "./menu-items";
import { MobileDrawer } from "../drawers";
import { UserProfile } from "./user-profile";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user } = useUserState();

  const buttonActiveClass = "bg-accent text-white";

  const allowedMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return user?.role && item.roles.includes(user.role);
  });
  const overflowMenuItems = allowedMenuItems.slice(4);
  const primaryMenuItems = allowedMenuItems.slice(0, 4);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-divider bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            onClick={() => setIsMenuOpen(true)}
            variant="ghost"
            className="text-muted sm:hidden"
            aria-label="Open main menu"
          >
            <CgMenuRight className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center no-underline">
            <span className="text-accent text-xl font-bold">Yadah Auth</span>
          </Link>
        </div>
        <nav className="hidden items-center gap-6 sm:flex">
          {primaryMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link href={item.href} key={item.label} className="no-underline">
                <Button variant="ghost" className={cn({ [buttonActiveClass]: isActive })}>
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
          {overflowMenuItems.length > 0 && (
            <Dropdown>
              <Button
                isIconOnly
                variant="ghost"
                className={cn({
                  [buttonActiveClass]: overflowMenuItems.some((item) => pathname === item.href),
                })}
                aria-label="More menu items"
              >
                <IoMdMore className="h-5 w-5" />
              </Button>
              <Dropdown.Popover aria-label="More menu items" placement="bottom end">
                <Dropdown.Menu>
                  {overflowMenuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Dropdown.Item
                        key={item.label}
                        href={item.href}
                        className={cn({ [buttonActiveClass]: isActive })}
                      >
                        {item.icon}
                        <Label>{item.label}</Label>
                      </Dropdown.Item>
                    );
                  })}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          )}
        </nav>
        <UserProfile />
      </div>
      <MobileDrawer items={allowedMenuItems} isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} />
    </header>
  );
};
