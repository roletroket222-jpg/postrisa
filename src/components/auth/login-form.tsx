"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";

import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";

import { loginAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState = {
  error: null,
  fieldErrors: {},
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="callbackUrl" type="hidden" value={callbackUrl} />

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoComplete="email"
            className="pl-11"
            defaultValue=""
            id="email"
            name="email"
            placeholder="admin@aquarium.local"
            type="email"
          />
        </div>
        {state.fieldErrors?.email?.length ? (
          <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoComplete="current-password"
            className="pl-11"
            defaultValue=""
            id="password"
            name="password"
            placeholder="********"
            type="password"
          />
        </div>
        {state.fieldErrors?.password?.length ? (
          <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <Button className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <LoaderCircle className="animate-spin" />
            Memproses Login
          </>
        ) : (
          "Masuk ke Sistem"
        )}
      </Button>
    </form>
  );
}
