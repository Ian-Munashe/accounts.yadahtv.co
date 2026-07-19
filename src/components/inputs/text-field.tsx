"use client";

import { LuEye, LuEyeOff } from "react-icons/lu";
import React, { useMemo, useState } from "react";
import { InputGroup, Label, FieldError, TextField as HText } from "@heroui/react";

import { Utils } from "@/lib/utils";

interface Props {
  formik: any;
  name: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  type?: React.HTMLInputTypeAttribute;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TextField: React.FC<Props> = ({ isRequired = true, isDisabled = false, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = props.type === "password" ? (showPassword ? "text" : "password") : props.type;

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
    <HText
      fullWidth
      name={props.name}
      isRequired={isRequired}
      isDisabled={isDisabled}
      isReadOnly={props.isReadOnly}
      isInvalid={hasError}
      variant="secondary"
    >
      <Label className="ml-0.5">{props.label}</Label>
      <InputGroup>
        {props.prefix && <InputGroup.Prefix className="pr-1.5 pl-2.5">{props.prefix}</InputGroup.Prefix>}
        <InputGroup.Input
          type={inputType}
          value={value}
          min={0}
          placeholder={props.placeholder}
          autoComplete={props.autoComplete}
          onChange={(event) => {
            props.formik.handleChange(event);
            props.onChange?.(event);
          }}
          className="disabled:pointer-events-none disabled:opacity-60"
          disabled={isDisabled}
          inputMode={props.inputMode}
        />
        <InputGroup.Suffix>
          {props.suffix ??
            (props.type === "password" && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{ background: "none", border: "none", padding: 0, margin: 0, cursor: "pointer" }}
              >
                {showPassword ? (
                  <LuEyeOff className="text-default-500" size={18} />
                ) : (
                  <LuEye className="text-default-500" size={18} />
                )}
              </button>
            ))}
        </InputGroup.Suffix>
      </InputGroup>
      <FieldError>{meta.errorMessage}</FieldError>
    </HText>
  );
};
