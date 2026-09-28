import type { ReactNode } from "react";

export {};

declare global {
  interface ITab {
    tab: string;
    icon: ReactNode;
  }
}
