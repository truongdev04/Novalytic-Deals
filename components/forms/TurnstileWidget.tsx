"use client";

import { useEffect, useRef } from "react";

type TurnstileAppearance = "always" | "execute" | "interaction-only";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          language?: string;
          appearance?: TurnstileAppearance;
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

// Renders nothing when no site key is configured (dev/before Cloudflare
// account is set up) — server-side verification is skipped to match.
export function TurnstileWidget({
  onVerify,
  appearance = "always",
}: {
  onVerify: (token: string) => void;
  // "interaction-only" keeps the widget invisible unless Cloudflare can't
  // verify silently — used on the forgot-password page to avoid showing a
  // visible checkbox for a low-friction flow.
  appearance?: TurnstileAppearance;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let widgetId: string | undefined;
    let cancelled = false;

    function renderWidget() {
      if (cancelled || !window.turnstile || !containerRef.current) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey as string,
        callback: onVerify,
        language: "en",
        appearance,
      });
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, onVerify, appearance]);

  if (!siteKey) return null;

  return <div ref={containerRef} className="mt-2" />;
}
