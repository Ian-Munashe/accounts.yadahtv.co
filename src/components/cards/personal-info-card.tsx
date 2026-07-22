import { Fragment } from "react";
import { useFormik } from "formik";
import { IoMaleFemale } from "react-icons/io5";
import { LuGlobe, LuSave, LuUser } from "react-icons/lu";
import { Button, Description, Form, Spinner, Surface, toast } from "@heroui/react";

import { useAxios } from "@/hooks";
import { countries } from "@/countries";
import { useUserState } from "@/stores";
import { genderOptions } from "@/gender-options";
import { updateSession } from "@/actions/session-action";
import { SelectInput, AutocompleteInput, TextField } from "../inputs";

export const PersonalInfoCard: React.FC = () => {
  const { user, setUser } = useUserState();
  const { interceptor } = useAxios();

  const formik = useFormik({
    initialValues: { fullname: user?.fullname, country: user?.country, gender: user?.gender },
    onSubmit: async (values) => {
      try {
        const response = await interceptor.put("/user/update", values);
        const user = response.data;
        await updateSession({ user });
        setUser(user);
        toast.success("Personal information updated successfully!");
      } catch (error: any) {
        toast.danger(error.response?.data?.message || error.message);
      }
    },
  });

  return (
    <Surface variant="default" className="rounded-2xl p-6">
      <header className="mb-6 space-y-1">
        <h2 className="text-foreground flex items-center gap-2 text-base font-semibold">
          <LuUser className="text-accent h-5 w-5" />
          Personal Information
        </h2>
        <Description>
          Keep your personal information up to date, including your full name, gender, and country of residence. This
          helps us personalize your experience and ensure your account details are accurate.
        </Description>
      </header>
      <Form onSubmit={formik.handleSubmit} validationBehavior="aria" className="flex flex-col gap-4">
        <TextField
          formik={formik}
          label="Full Name"
          name="fullname"
          placeholder="Enter your full name"
          autoComplete="name"
          prefix={<LuUser size={15} className="text-muted" />}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectInput
            formik={formik}
            options={genderOptions}
            name="gender"
            label="Gender"
            placeholder="Select your gender"
            prefix={<IoMaleFemale size={15} className="text-muted" />}
          />
          <AutocompleteInput
            formik={formik}
            options={countries}
            name="country"
            label="Country"
            placeholder="Select your country"
            prefix={<LuGlobe size={15} className="text-muted" />}
          />
        </div>
        <div className="mt-2 flex justify-end">
          <Button type="submit" isPending={formik.isSubmitting}>
            {({ isPending }) => (
              <Fragment>
                {isPending ? <Spinner color="current" size="sm" /> : <LuSave size={15} />} Save Changes
              </Fragment>
            )}
          </Button>
        </div>
      </Form>
    </Surface>
  );
};
