import { Container } from "@/components/layout/Container";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function StoreLoading() {
  return (
    <Container className="py-10">
      <LoadingSkeleton className="h-4 w-48" />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        <div className="rounded-xl border border-muted-200 bg-surface-0 p-6">
          <LoadingSkeleton className="h-16 w-16 rounded-full" />
          <LoadingSkeleton className="mt-4 h-5 w-3/4" />
          <LoadingSkeleton className="mt-2 h-4 w-1/2" />
          <LoadingSkeleton className="mt-6 h-10 w-full rounded-xl" />
        </div>

        <div>
          <LoadingSkeleton className="h-8 w-2/3" />
          <LoadingSkeleton className="mt-3 h-4 w-1/3" />
          <div className="mt-6 space-y-3">
            <LoadingSkeleton className="h-20 w-full rounded-xl" />
            <LoadingSkeleton className="h-20 w-full rounded-xl" />
            <LoadingSkeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </Container>
  );
}
