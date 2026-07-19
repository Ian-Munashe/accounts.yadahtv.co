import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devices",
  description:
    "View and manage all devices currently signed in to your Yadah TV account. Sign out or remove devices to keep your account secure.",
};

export default function DevicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
