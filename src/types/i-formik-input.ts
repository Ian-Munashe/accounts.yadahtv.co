import type { ChangeEvent } from "react";

export {};

declare global {
  interface IFormikInput {
    values: Record<string, unknown>;
    errors: Record<string, unknown>;
    touched: Record<string, unknown>;
    submitCount: number;
    setFieldValue: (field: string, value: unknown, shouldValidate?: boolean) => void;
    handleChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  }
}
