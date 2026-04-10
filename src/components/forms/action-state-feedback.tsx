"use client";

import { useEffect } from "react";

import { toast } from "sonner";

import type { FormActionState } from "@/server/form-state";

type ActionStateFeedbackProps = {
  state: FormActionState;
};

export function useActionStateToast(state: FormActionState) {
  useEffect(() => {
    if (state.status === "success" && state.message) {
      toast.success(state.message);
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state.message, state.status]);
}

export function ActionStateFeedback({ state }: ActionStateFeedbackProps) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  const isError = state.status === "error";

  return (
    <div
      className={
        isError
          ? "rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          : "rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary"
      }
    >
      {state.message}
    </div>
  );
}
