import Image from "next/image";
import { Link } from "next-view-transitions";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/types";

export function BlogHero({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative block h-[380px] overflow-hidden rounded-2xl sm:h-[440px] lg:h-[520px]"
    >
      <Image
        src={post.coverImage}
        alt={post.title}
        fill
        priority
        sizes="100vw"
        className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
        <h2 className="max-w-2xl font-heading text-2xl font-bold text-white sm:text-4xl">
          {post.title}
        </h2>
        <p className="mt-3 max-w-2xl line-clamp-2 text-white/80">{post.excerpt}</p>
        <div className="mt-4 flex items-center gap-4 text-sm text-white/70">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            {formatDate(post.publishedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {post.readingMinutes} min read
          </span>
        </div>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent-500 px-5 py-2.5 text-sm font-medium text-white transition-colors group-hover:bg-accent-600">
          Read article
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
