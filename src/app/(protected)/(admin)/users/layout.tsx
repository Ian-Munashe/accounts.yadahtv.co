import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management",
  description:
    "Manage users for your organization. Invite, suspend, or edit user accounts, and review current access levels across all connected PHD Ministries applications.",
};

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
