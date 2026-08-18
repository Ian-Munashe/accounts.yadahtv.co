"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Description, Separator, toast } from "@heroui/react";

import { useAxios } from "@/hooks/axios-hook";
import { useAuthentication } from "@/hooks";
import { StepPill } from "@/components/step-pill";
import { stepFadeAnimation } from "@/lib/animations";
import { OTPForm, RequestCodeForm } from "@/components/forms";
import { getSession, updateSession } from "@/actions/session-action";
import { authPathWithReturnTo, resumeAfterAuth, ssoResumeTarget } from "@/lib/sso-return";

enum Steps {
  VERIFY = "verify",
  CONTACT = "contact",
  COMPLETE = "complete",
}

export default function SignIn() {
  const action = "sign-in";
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { axios } = useAxios();
  const { getUser } = useAuthentication();

  const [identifier, setIdentifier] = useState<string>("");
  const [step, setStep] = useState<Steps>(Steps.CONTACT);

  useEffect(() => {
    if (returnTo) updateSession({ ssoReturnTo: returnTo });
  }, [returnTo]);

  const steps: Steps[] = [Steps.CONTACT, Steps.VERIFY];
  const stepIndex = steps.findIndex((i) => i === step);
  const header = (
    <header>
      <h1 className="text-foreground font-heading text-2xl leading-snug font-semibold tracking-tight">Welcome back</h1>
      <Description>Enter your email address or WhatsApp number to receive a secure one-time code.</Description>
    </header>
  );
  const footer = (
    <Description className="flex flex-wrap items-center gap-1">
      Don&apos;t have an account?&nbsp;
      <a href={authPathWithReturnTo("/join", returnTo)} className="text-accent font-medium">
        Create Account
      </a>
    </Description>
  );

  const createSession = async (token: string) => {
    try {
      const response = await axios.post(`/user/create-session?t=${token}`, {});
      const { accessToken, refreshToken } = response.data;
      await updateSession({ accessToken, refreshToken });
      const isSuccess = await getUser();
      if (isSuccess) {
        const session = await getSession();
        await resumeAfterAuth(ssoResumeTarget(returnTo, session.ssoReturnTo));
      }
    } catch (error: any) {
      toast.danger(error?.response?.data?.message ?? error.message);
    }
  };

  const renderForms = () => {
    const className = "overflow-visible";
    switch (step) {
      case Steps.VERIFY:
        return (
          identifier && (
            <motion.div key={Steps.VERIFY} className={className} {...stepFadeAnimation}>
              <OTPForm
                identifier={identifier}
                action={action}
                onSuccess={createSession}
                onBack={() => setStep(Steps.CONTACT)}
              />
            </motion.div>
          )
        );
      default:
        return (
          <motion.div key={Steps.CONTACT} className={className} {...stepFadeAnimation}>
            <RequestCodeForm
              action={action}
              header={header}
              footer={footer}
              onSuccess={(value) => {
                setIdentifier(value);
                setStep(Steps.VERIFY);
              }}
            />
          </motion.div>
        );
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-2 md:px-0">
      <div className="mb-8 flex shrink-0 items-center gap-2">
        {steps.map((item, idx: number) => {
          const completed = idx < stepIndex;
          return (
            <div key={item} className="flex items-center gap-2">
              {idx > 0 && <Separator variant="secondary" className="w-8" />}
              <StepPill active={item === step} completed={completed} label={item} step={idx + 1} />
            </div>
          );
        })}
      </div>
      <AnimatePresence mode="wait">{renderForms()}</AnimatePresence>
    </main>
  );
}
