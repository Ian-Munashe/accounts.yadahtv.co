import { object, string } from "yup";

const applicationTypes: string[] = ["web", "mobile", "api", "desktop"];

/**
 * Validation schema for applications.
 * 
 * Ensures that:
 * - `clientId` is a required string, trimmed, in lowercase, and has a minimum length of 3 characters.
 * - `permissions` is an optional string.
 * - `type` is a required string matching one of the allowed `applicationTypes`.
 */
const ApplicationValidationSchema = object().shape({
  clientId: string().trim().min(3, "A minimum of 3 charactors is required").lowercase().required().label("Client ID"),
  permissions: string().optional(),
  type: string()
    .oneOf(
      applicationTypes.map((i) => i),
      "Invalid application type selected",
    )
    .required()
    .label("Application type"),
});

export { ApplicationValidationSchema, applicationTypes };
