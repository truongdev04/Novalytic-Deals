import { Container } from "@/components/layout/Container";
import { CardSkeleton, LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function CategoryLoading() {
  return (
    <Container className="py-10">
      <LoadingSkeleton className="h-4 w-40" />
      <LoadingSkeleton className="mt-4 h-40 w-full rounded-2xl" />

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </Container>
  );
}
