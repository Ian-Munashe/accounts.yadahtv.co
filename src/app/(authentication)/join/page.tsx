"use client";

import { useState } from "react";
import { Description, Separator } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";

import { StepPill } from "@/components/step-pill";
import { stepFadeAnimation } from "@/lib/animations";
import { AccountRegistrationForm, OTPForm, RequestCodeForm } from "@/components/forms";

enum Steps {
  VERIFY = "verify",
  CONTACT = "contact",
  COMPLETE = "complete",
}

export default function SignIn() {
  const action = "sign-up";

  const [token, setToken] = useState<string>("");
  const [identifier, setIdentifier] = useState<string>("");
  const [step, setStep] = useState<Steps>(Steps.CONTACT);

  const steps: Steps[] = [Steps.CONTACT, Steps.VERIFY, Steps.COMPLETE];
  const stepIndex = steps.findIndex((i) => i === step);
  const header = (
    <header>
      <h1 className="text-foreground font-heading text-2xl leading-snug font-semibold tracking-tight">
        Create your account
      </h1>
      <Description>
        Enter the email address or phone number you want to use for your account, and we'll send you a one-time code.
      </Description>
    </header>
  );
  const footer = (
    <Description className="flex flex-wrap items-center gap-1">
      Already have an account?
      <a href="/signin" className="text-accent font-medium">
        Sign In
      </a>
    </Description>
  );

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
                onBack={() => setStep(Steps.CONTACT)}
                onSuccess={(token) => {
                  setToken(token);
                  setStep(Steps.COMPLETE);
                }}
              />
            </motion.div>
          )
        );
      case Steps.COMPLETE:
        return (
          identifier && (
            <motion.div key={Steps.COMPLETE} className={className} {...stepFadeAnimation}>
              <AccountRegistrationForm token={token} />
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
    <main className="flex min-h-screen flex-col items-center justify-center px-4 md:px-0">
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
