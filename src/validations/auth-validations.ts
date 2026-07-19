import { object, string } from "yup";

import { countries } from "@/countries";
import { phoneCodes } from "@/phone-codes";
import { genderOptions } from "@/gender-options";

const actions = ["sign-in", "sign-up", "add-contact", "change-contact", "verify-current-contact", "change-identifier"];

/**
 * Validation schema for email-based identifier requests (e.g., sending verification codes to email).
 * Ensures that:
 * - The action is a valid predefined string.
 * - The email field is a properly formatted email and is required.
 */
const EmailIdentifierValidationSchema = object().shape({
  action: string().oneOf(actions, "Invalid action selected").required(),
  email: string().email("Please enter a valid email address").required("Email is required"),
});

/**
 * Validation schema for phone-based identifier requests (e.g., sending verification codes to phone numbers).
 * Ensures that:
 * - The action is a valid predefined string.
 * - The country code is selected from the allowed codes.
 * - The phone number is entered, trimmed, does not include the country code, and is required.
 */
const PhoneIdentifierValidationSchema = object().shape({
  action: string().oneOf(actions, "Invalid action selected").required(),
  code: string()
    .oneOf(
      phoneCodes.map((i) => i.value),
      "Invalid country code selected",
    )
    .required("Country is required"),
  phone: string()
    .trim()
    .required("Phone number is required")
    .test("no-country-code", "Phone number must not include the country code", function (value) {
      const { code } = this.parent;
      if (!value || !code) return true;
      const cleanCode = code.replace(/\+/g, "").trim();
      const cleanPhone = value.replace(/\+/g, "").trim();
      return !cleanPhone.startsWith(cleanCode);
    }),
});

/**
 * Validation schema for user registration.
 * Ensures that:
 * - The full name is at least 2 characters and provided.
 * - The gender field matches one of the allowed gender options.
 * - The country field matches one of the allowed countries.
 */
const RegisterValidationSchema = object().shape({
  fullname: string().trim().min(2, "Full name must be at least 2 characters long").required("Full name is required"),
  gender: string()
    .oneOf(
      genderOptions.map((i) => i.value),
      "Please select a valid gender",
    )
    .required("Gender is required"),
  country: string()
    .oneOf(
      countries.map((i) => i.value),
      "Please select a valid country",
    )
    .required("Country is required"),
});

export { PhoneIdentifierValidationSchema, EmailIdentifierValidationSchema, RegisterValidationSchema };
