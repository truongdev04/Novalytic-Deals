import { Container } from "@/components/layout/Container";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function BlogPostLoading() {
  return (
    <Container className="py-10">
      <LoadingSkeleton className="h-4 w-48" />

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_260px]">
        <div>
          <LoadingSkeleton className="h-8 w-3/4" />
          <LoadingSkeleton className="mt-3 h-4 w-1/3" />
          <LoadingSkeleton className="mt-6 aspect-video w-full rounded-xl" />
          <div className="mt-8 space-y-4">
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-2/3" />
          </div>
        </div>
        <LoadingSkeleton className="h-48 w-full rounded-xl" />
      </div>
    </Container>
  );
}
