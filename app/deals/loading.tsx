import { Container } from "@/components/layout/Container";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";

export default function DealsLoading() {
  return (
    <Container className="py-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </Container>
  );
}
