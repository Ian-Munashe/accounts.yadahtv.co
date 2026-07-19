import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Access your Yadah TV account securely. Sign in with your credentials to manage your profile and connect to all PHD Ministries applications.",
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
