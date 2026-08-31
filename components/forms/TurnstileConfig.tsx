"use client";

import { createContext, useContext } from "react";

// The Turnstile site key can be set from the admin Integrations settings
// (stored in the DB) so it no longer has to be a build-time
// NEXT_PUBLIC_TURNSTILE_SITE_KEY env var. The root layout fetches the
// effective value on the server and feeds it in here; every TurnstileWidget
// reads it via `useTurnstileSiteKey`, falling back to the env var when the
// provider isn't present (or the value is empty).
const TurnstileSiteKeyContext = createContext<string | undefined>(undefined);

export function TurnstileSiteKeyProvider({
  value,
  children,
}: {
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <TurnstileSiteKeyContext.Provider value={value}>{children}</TurnstileSiteKeyContext.Provider>
  );
}

export function useTurnstileSiteKey(): string | undefined {
  return useContext(TurnstileSiteKeyContext) || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}
