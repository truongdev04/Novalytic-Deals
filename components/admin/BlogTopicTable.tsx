"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Search } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminPagination } from "@/lib/hooks/useAdminPagination";
import type { BlogTopic } from "@/types";

export function BlogTopicTable({ topics }: { topics: BlogTopic[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter(
      (topic) => topic.name.toLowerCase().includes(q) || topic.slug.toLowerCase().includes(q)
    );
  }, [topics, query]);

  const { page, pageSize, paged, total, setPage, setPageSize } = useAdminPagination(filtered);

  return (
    <div>
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
        <input
          type="text"
          placeholder="Search topics..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-muted-300 bg-surface-0 py-2 pl-9 pr-3 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((topic) => (
              <tr key={topic.id} className="border-t border-muted-200">
                <td className="px-4 py-3 font-medium text-brand-950">{topic.name}</td>
                <td className="px-4 py-3 text-muted-600">{topic.slug}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-600">
                  {new Date(topic.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/blog/topics/${topic.id}`}
                      aria-label={`Edit ${topic.name}`}
                      className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteButton
                      endpoint={`/api/admin/blog-topics/${topic.id}`}
                      confirmLabel={topic.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-500">
                  No topics found.
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
