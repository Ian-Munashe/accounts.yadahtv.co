import type { ReactNode } from "react";

export {};

declare global {
  interface INavigationItem {
    href: string;
    label: string;
    icon?: ReactNode;
    roles?: ("superadmin" | "admin" | "editor" | "user")[];
  }
}
