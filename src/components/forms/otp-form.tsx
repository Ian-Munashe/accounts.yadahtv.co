"use client";

import { useFormik } from "formik";
import { object, string } from "yup";
import React, { useState, useEffect } from "react";
import { LuArrowLeft, LuShieldCheck } from "react-icons/lu";
import {
  Button,
  Form,
  InputOTP,
  Link,
  Separator,
  Spinner,
  Surface,
  toast,
  REGEXP_ONLY_DIGITS,
  Description,
  cn,
} from "@heroui/react";

import { mask } from "@/lib/mask";
import { useOTPWaitState } from "@/stores";
import { useAxios } from "@/hooks/axios-hook";

interface Props {
  action: string;
  identifier: string;
  className?: string;
  showFooter?: boolean;
  isModalContext?: boolean;
  onBack?: () => void;
  onSuccess: (token: string) => void;
}

export const OTPForm: React.FC<Props> = ({ showFooter = true, isModalContext = false, ...props }) => {
  const { axios } = useAxios();
  const { timer, startCountdown } = useOTPWaitState();

  const waitTime = 120;

  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { otp: value, identifier: props.identifier, action: props.action },
    validationSchema: object().shape({ otp: string().max(6, "OTP must be 6 digits").required("OTP is required") }),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const response = await axios.post("/otp/verify", values);
        props.onSuccess(response.data.token);
      } catch (error: any) {
        setIsSubmitting(false);
        toast.danger(error?.response?.data?.message ?? error.message);
      }
    },
  });

  const handleResend = async () => {
    if (timer < 1 && props.identifier && props.action) {
      try {
        setLoading(true);
        const response = await axios.post(`/otp/create`, { identifier: props.identifier, action: props.action });
        toast.success(response.data.message);
        startCountdown(waitTime);
        setValue("");
      } catch (error: any) {
        toast.danger(error?.response?.data?.message ?? error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (timer > 0) {
      const timeoutId = setTimeout(() => startCountdown(timer - 1), 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [timer]);

  return (
    <Surface
      className={cn(
        "mx-auto flex w-full flex-col gap-6 transition-all",
        isModalContext ? "bg-transparent p-2 shadow-none" : "max-w-md rounded-3xl p-6 shadow-sm sm:p-8",
        props.className,
      )}
      variant={isModalContext ? "transparent" : "default"}
    >
      <header className="flex w-full flex-col items-center gap-3 text-center">
        <span className="bg-accent/10 text-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
          <LuShieldCheck size={22} />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-foreground font-heading text-xl leading-snug font-semibold tracking-tight sm:text-2xl">
            Check your inbox
          </h1>
          <Description className="block text-sm">
            We sent a 6-digit code to <span className="text-foreground font-medium">{mask(props.identifier)}</span>
          </Description>
        </div>
      </header>
      <Form onSubmit={formik.handleSubmit} validationBehavior="aria" className="flex w-full flex-col gap-5">
        <div className="flex w-full flex-col items-center gap-4">
          <div className="flex w-full justify-center py-1">
            <InputOTP
              maxLength={6}
              variant="secondary"
              value={value}
              onChange={setValue}
              autoFocus
              pattern={REGEXP_ONLY_DIGITS}
            >
              <InputOTP.Group>
                <InputOTP.Slot index={0} />
                <InputOTP.Slot index={1} />
                <InputOTP.Slot index={2} />
              </InputOTP.Group>
              <InputOTP.Separator />
              <InputOTP.Group>
                <InputOTP.Slot index={3} />
                <InputOTP.Slot index={4} />
                <InputOTP.Slot index={5} />
              </InputOTP.Group>
            </InputOTP>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <p className="text-muted text-sm">{timer > 0 ? `Resend available in ${timer}s` : "Didn't get the code?"}</p>
            {timer > 0 ? null : loading ? (
              <Spinner size="sm" />
            ) : (
              <Link onPress={handleResend} isDisabled={timer > 0} className="text-accent text-sm font-medium">
                Resend code
              </Link>
            )}
          </div>
        </div>
        <Button fullWidth isDisabled={value.length < 6} isPending={isSubmitting} type="submit" size="lg">
          {({ isPending }) => (
            <React.Fragment>{isPending ? <Spinner color="current" size="sm" /> : null} Verify Code</React.Fragment>
          )}
        </Button>
        {showFooter && (
          <div className="flex flex-col items-center space-y-4">
            <Separator />
            <Description className="flex flex-wrap items-center gap-1">
              <Link href="#" className="text-muted font-medium" onPress={props.onBack}>
                <LuArrowLeft size={16} />
                Use a different contact
              </Link>
            </Description>
          </div>
        )}
      </Form>
    </Surface>
  );
};
