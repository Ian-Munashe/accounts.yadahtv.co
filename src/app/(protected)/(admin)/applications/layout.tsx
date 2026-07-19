import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Applications",
  description:
    "View and manage all applications connected to your Yadah TV account. Configure permissions, disconnect applications, and ensure your account security.",
};

export default function ApplicationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
