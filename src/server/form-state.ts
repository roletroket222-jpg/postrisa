export type FormActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors: Partial<Record<string, string[]>>;
};

export const initialFormActionState: FormActionState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

export function successState(message: string): FormActionState {
  return {
    status: "success",
    message,
    fieldErrors: {},
  };
}

export function errorState(
  message: string,
  fieldErrors: FormActionState["fieldErrors"] = {},
): FormActionState {
  return {
    status: "error",
    message,
    fieldErrors,
  };
}
