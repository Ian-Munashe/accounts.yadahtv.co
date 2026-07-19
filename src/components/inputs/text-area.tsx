"use client";

import React, { useMemo } from "react";
import { TextField, Label, FieldError, TextArea as HTextArea } from "@heroui/react";

import { Utils } from "@/lib/utils";

interface TextAreaProps {
  formik: any;
  name: string;
  label: string;
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({ isRequired = true, ...props }) => {
  const meta = useMemo(() => {
    const error = Utils.instance.getValueByPath(props.formik?.errors, props.name);
    const touched = Utils.instance.getValueByPath(props.formik?.touched, props.name);
    return {
      error,
      touched,
      errorMessage: typeof error === "string" ? error : undefined,
    };
  }, [props.formik?.errors, props.formik?.touched, props.name]);

  const value = Utils.instance.getValueByPath(props.formik?.values, props.name);
  const hasError = Boolean(meta.error && (meta.touched || props.formik?.submitCount > 0));

  return (
    <TextField
      fullWidth
      name={props.name}
      isRequired={isRequired}
      isInvalid={hasError}
      variant="secondary"
    >
      <Label className="ml-0.5">{props.label}</Label>
      <HTextArea
        fullWidth
        className="h-20"
        value={value}
        placeholder={props.placeholder}
        onChange={props.formik.handleChange}
      />
      <FieldError>{meta.errorMessage}</FieldError>
    </TextField>
  );
};
