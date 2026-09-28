/**
 * Extracts a user-facing message from an unknown thrown value.
 * Reads the API error payload message first, then falls back to the Error message.
 */
export const getErrorMessage = (error: unknown): string => {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || "";
};
