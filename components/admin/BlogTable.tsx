"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Search } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ToggleButton } from "@/components/admin/ToggleButton";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminPagination } from "@/lib/hooks/useAdminPagination";
import type { BlogPost } from "@/types";

export function BlogTable({ posts }: { posts: BlogPost[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) => p.title.toLowerCase().includes(q) || p.author.name.toLowerCase().includes(q)
    );
  }, [posts, query]);

  const { page, pageSize, paged, total, setPage, setPageSize } = useAdminPagination(filtered);

  return (
    <div>
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
        <input
          type="text"
          placeholder="Search posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-muted-300 bg-surface-0 py-2 pl-9 pr-3 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              <th className="px-4 py-3">Cover</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((post) => (
              <tr key={post.id} className="border-t border-muted-200">
                <td className="px-4 py-3">
                  <div className="relative h-10 w-16 overflow-hidden rounded border border-muted-200 bg-surface-100">
                    <Image src={post.coverImage} alt={post.title} fill sizes="64px" className="object-cover" />
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-brand-950">{post.title}</td>
                <td className="px-4 py-3 text-muted-600">{post.author.name}</td>
                <td className="px-4 py-3 text-muted-600">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <ToggleButton
                    endpoint={`/api/admin/blog/${post.id}`}
                    field="isFeatured"
                    value={post.isFeatured}
                    label={post.isFeatured ? "Featured" : "Not featured"}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/blog/${post.id}`}
                      aria-label={`Edit ${post.title}`}
                      className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteButton endpoint={`/api/admin/blog/${post.id}`} confirmLabel={post.title} />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-500">
                  No posts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
