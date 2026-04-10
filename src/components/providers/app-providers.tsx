"use client";

import type { ReactNode } from "react";

import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster closeButton position="top-right" richColors />
    </ThemeProvider>
  );
}
