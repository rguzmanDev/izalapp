import { z } from "zod";

/** Result returned by Server Actions used with <ActionForm>. */
export type FormState = {
  error?: string;
  /** Soft warning that can be overridden by resubmitting with confirmInsufficient=1. */
  warning?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

type ParseResult<T> = { success: true; data: T } | { success: false; state: FormState };

export function parseFormData<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): ParseResult<z.output<T>> {
  const result = schema.safeParse(Object.fromEntries(formData));
  if (result.success) return { success: true, data: result.data };

  return {
    success: false,
    state: { fieldErrors: z.flattenError(result.error).fieldErrors as FormState["fieldErrors"] },
  };
}
