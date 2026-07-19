import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up for Yadah TV",
  description:
    "Join Yadah TV to access exclusive content. Sign up easily and securely with a verification code sent to your email—no password required.",
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
