"use client";

import { useFormik } from "formik";
import React, { useState } from "react";
import { LuGlobe, LuPhone } from "react-icons/lu";
import { MdOutlineAlternateEmail } from "react-icons/md";
import { Button, cn, Form, Key, Separator, Spinner, Surface, Tabs, toast } from "@heroui/react";

import { Utils } from "@/lib/utils";
import { useOTPWait } from "@/hooks";
import { phoneCodes } from "@/phone-codes";
import { useAxios } from "@/hooks/axios-hook";
import { getErrorMessage } from "@/lib/error-message";
import { AutocompleteInput, TextField } from "../inputs";
import { EmailIdentifierValidationSchema, PhoneIdentifierValidationSchema } from "@/validations";

interface Props {
  action: string;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  onSuccess?: (value: string) => void;
}

const tabs: ITab[] = [
  { tab: "email", icon: <MdOutlineAlternateEmail /> },
  { tab: "phone", icon: <LuPhone /> },
];

export const RequestCodeForm: React.FC<Props> = (props) => {
  const { axios } = useAxios();
  const { timer, isSyncing, beginCountdown } = useOTPWait();

  const [isEmail, setIsEmail] = useState<boolean>(true);
  const [option, setOption] = useState<Key>(tabs[0].tab);

  const formik = useFormik({
    initialValues: { email: "", code: "", phone: "", action: props.action },
    validationSchema: isEmail ? EmailIdentifierValidationSchema : PhoneIdentifierValidationSchema,
    onSubmit: async (values) => {
      try {
        const formattedPhone = `${values.code.trim()}${values.phone.trim()}`;
        const identifier = isEmail ? values.email : formattedPhone;
        const endpoint = values.action === "signin" ? "/user/signin" : "/otp/create";
        await axios.post(endpoint, { identifier, action: values.action });
        void beginCountdown();
        props.onSuccess?.(identifier);
      } catch (error) {
        toast.danger(getErrorMessage(error));
      } finally {
        formik.setSubmitting(false);
      }
    },
  });

  const onSelectionChange = (value: Key) => {
    const switchingToEmail = value === "email";
    setOption(value);
    setIsEmail(switchingToEmail);
    if (switchingToEmail) {
      formik.setFieldValue("phone", "");
      formik.setFieldValue("code", "");
    } else {
      formik.setFieldValue("email", "");
    }
  };

  return (
    <Surface className={cn("flex flex-col gap-6 rounded-3xl p-6 sm:p-8 md:w-lg", props.className)} variant="default">
      {props.header}
      <Form onSubmit={formik.handleSubmit} validationBehavior="aria" className="flex w-full flex-col gap-4">
        <Tabs selectedKey={option} onSelectionChange={onSelectionChange}>
          <Tabs.ListContainer>
            <Tabs.List aria-label="Options">
              {tabs.map((item) => (
                <Tabs.Tab key={item.tab} id={item.tab} className="space-x-1.5">
                  <span>{item.icon}</span>
                  <span>{Utils.instance.capitalize(item.tab)}</span>
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
          <Tabs.Panel id="email" className="flex flex-col gap-4 px-0">
            {props.children}
            <TextField
              formik={formik}
              name="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              prefix={<MdOutlineAlternateEmail size={15} className="text-muted" />}
            />
          </Tabs.Panel>
          <Tabs.Panel id="phone" className="flex flex-col gap-4 px-0">
            {props.children}
            <AutocompleteInput
              formik={formik}
              name="code"
              label="Country"
              placeholder="Select Country"
              options={phoneCodes}
              prefix={<LuGlobe size={15} className="text-muted" />}
            />
            <TextField
              formik={formik}
              name="phone"
              label="Phone"
              placeholder="771234567"
              prefix={<LuPhone size={15} className="text-muted" />}
            />
          </Tabs.Panel>
        </Tabs>
        <Button
          type="submit"
          fullWidth
          isPending={formik.isSubmitting}
          isDisabled={formik.isSubmitting || isSyncing || timer > 0 || !(formik.isValid && formik.dirty)}
        >
          {({ isPending }) => (
            <React.Fragment>
              {isPending ? <Spinner color="current" size="sm" /> : null} Send Verification Code
            </React.Fragment>
          )}
        </Button>
        {timer > 0 && <p className="text-muted text-center text-sm">You can request another code in {timer}s.</p>}
      </Form>
      {props.footer && (
        <div className="flex flex-col items-center space-y-4">
          <Separator />
          {props.footer}
        </div>
      )}
    </Surface>
  );
};
