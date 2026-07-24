import Image from "next/image";
import { Link } from "next-view-transitions";
import { CalendarDays, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/types";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-muted-200 bg-surface-0 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-video w-full overflow-hidden">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/blog/${post.slug}`}>
          <h3 className="font-heading text-base font-semibold text-brand-950 hover:text-brand-700 sm:text-lg">
            {post.title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-600">{post.excerpt}</p>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-500">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(post.publishedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {post.readingMinutes} min read
          </span>
        </div>
      </div>
    </article>
  );
}
