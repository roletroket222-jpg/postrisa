"use client";

import { useFormStatus } from "react-dom";

import { LoaderCircle } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

type ConfirmSubmitButtonProps = ButtonProps & {
  confirmMessage: string;
  pendingLabel?: string;
};

export function ConfirmSubmitButton({
  children,
  confirmMessage,
  pendingLabel = "Memproses...",
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      disabled={pending || props.disabled}
      onClick={(event) => {
        const confirmed = window.confirm(confirmMessage);

        if (!confirmed) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
      {...props}
    >
      {pending ? (
        <>
          <LoaderCircle className="animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
