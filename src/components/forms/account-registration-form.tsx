import React from "react";
import { useFormik } from "formik";
import { IoMaleFemale } from "react-icons/io5";
import { LuArrowLeft, LuGlobe, LuUser } from "react-icons/lu";
import { Button, Description, Form, Link, Separator, Spinner, Surface, toast } from "@heroui/react";

import { countries } from "@/countries";
import { useAxios } from "@/hooks/axios-hook";
import { useAuthentication } from "@/hooks";
import { genderOptions } from "@/gender-options";
import { RegisterValidationSchema } from "@/validations";
import { getSession, updateSession } from "@/actions/session-action";
import { authPathWithReturnTo, resumeAfterAuth, ssoResumeTarget } from "@/lib/sso-return";
import { AutocompleteInput, SelectInput, TextField } from "../inputs";

interface Props {
  token: string;
  returnTo?: string | null;
}

export const AccountRegistrationForm: React.FC<Props> = (props) => {
  const { axios } = useAxios();
  const { getUser } = useAuthentication();

  const formik = useFormik({
    initialValues: { fullname: "", country: "", gender: "" },
    validationSchema: RegisterValidationSchema,
    onSubmit: async (values) => {
      try {
        let response = await axios.post(`/user/finish-signup?t=${props.token}`, values);
        toast.success(response.data.message);
        response = await axios.post(`/user/create-session?t=${props.token}`, {});
        const { accessToken, refreshToken } = response.data;
        await updateSession({ accessToken, refreshToken });
        const isSuccess = await getUser();
        if (isSuccess) {
          const session = await getSession();
          resumeAfterAuth(ssoResumeTarget(props.returnTo, session.ssoReturnTo));
        }
      } catch (error: any) {
        toast.danger(error.response?.data?.message || error.message);
      }
    },
  });

  return (
    <Surface className="flex flex-col gap-6 rounded-3xl p-6 sm:p-8 md:w-lg" variant="default">
      <header className="space-y-2">
        <h1 className="text-foreground font-heading text-2xl leading-snug font-semibold tracking-tight">
          Complete Account Registration
        </h1>
        <Description>Enter your details to get started</Description>
      </header>
      <Form onSubmit={formik.handleSubmit} validationBehavior="aria" className="flex w-full flex-col gap-5">
        <div className="flex w-full flex-col gap-2">
          <TextField
            formik={formik}
            label="Full name"
            name="fullname"
            placeholder="Enter your full name"
            autoComplete="fullname"
            prefix={<LuUser size={16} />}
          />
          <SelectInput
            formik={formik}
            options={genderOptions}
            name="gender"
            label="Gender"
            placeholder="Please select your gender"
            prefix={<IoMaleFemale size={15} className="text-muted" />}
          />
          <AutocompleteInput
            formik={formik}
            options={countries}
            name="country"
            label="Country"
            placeholder="Please select your country"
            prefix={<LuGlobe size={15} className="text-muted" />}
          />
        </div>
        <Button fullWidth isPending={formik.isSubmitting} type="submit">
          {({ isPending }) => (
            <React.Fragment>{isPending ? <Spinner color="current" size="sm" /> : null} Submit Details</React.Fragment>
          )}
        </Button>
        <div className="flex flex-col items-center space-y-4">
          <Separator />
          <Description className="flex flex-wrap items-center gap-1">
            <Link href={authPathWithReturnTo("/join", props.returnTo)} className="text-muted font-medium">
              <LuArrowLeft size={16} />
              Use a different contact
            </Link>
          </Description>
        </div>
      </Form>
    </Surface>
  );
};
