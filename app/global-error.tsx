"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import "./globals.css";

// Only fires when the root layout itself throws — app/error.tsx can't catch
// that (a Next.js error boundary can't catch errors from its own parent
// layout), so without this file that case fell through to Next's bare
// unstyled 500 screen with no header/nav/way back to the site.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-full bg-surface-50 text-foreground">
        <Container className="flex min-h-screen items-center py-20">
          <EmptyState
            title="This page couldn't load"
            description="An unexpected error occurred. Please try again, or head back to the homepage."
            action={
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button onClick={() => reset()} variant="primary">
                  Try again
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Back to home</Link>
                </Button>
              </div>
            }
          />
        </Container>
      </body>
    </html>
  );
}
