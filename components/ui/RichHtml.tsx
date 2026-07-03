import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";

export function RichHtml({ html, className }: { html: string; className?: string }) {
  const clean = DOMPurify.sanitize(html);
  return (
    <div className={cn("rich-text-content", className)} dangerouslySetInnerHTML={{ __html: clean }} />
  );
}
