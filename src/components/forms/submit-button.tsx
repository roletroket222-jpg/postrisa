"use client";

import { useFormStatus } from "react-dom";

import { LoaderCircle } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

type SubmitButtonProps = ButtonProps & {
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  pendingLabel = "Menyimpan...",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending || props.disabled} {...props}>
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
