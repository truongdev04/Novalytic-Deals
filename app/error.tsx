"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function Error({
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
    <Container className="py-20">
      <EmptyState
        title="Something went wrong"
        description="An unexpected error occurred. Please try again."
        action={
          <Button onClick={() => reset()} variant="primary">
            Try again
          </Button>
        }
      />
    </Container>
  );
}
