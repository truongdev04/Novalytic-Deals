import { Container } from "@/components/layout/Container";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function CouponLoading() {
  return (
    <Container className="py-10">
      <LoadingSkeleton className="h-4 w-48" />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-muted-200 bg-surface-0 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <LoadingSkeleton className="h-8 w-8 rounded-full" />
            <LoadingSkeleton className="h-4 w-32" />
          </div>
          <LoadingSkeleton className="mt-4 h-8 w-2/3" />
          <LoadingSkeleton className="mt-3 h-4 w-full" />
          <LoadingSkeleton className="mt-6 h-12 w-48 rounded-xl" />
        </div>

        <div className="rounded-xl border border-muted-200 bg-surface-0 p-6">
          <LoadingSkeleton className="h-4 w-1/2" />
          <LoadingSkeleton className="mt-3 h-16 w-full" />
        </div>
      </div>
    </Container>
  );
}
