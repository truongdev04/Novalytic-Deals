"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Search } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminDropdownSelect } from "@/components/admin/AdminDropdownSelect";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { SingleSelectDropdown } from "@/components/admin/SingleSelectDropdown";
import { useAdminPagination } from "@/lib/hooks/useAdminPagination";
import type { BlogPost } from "@/types";

const BOOL_FILTER_ALL = "all";

const featuredFilterOptions = [
  { value: BOOL_FILTER_ALL, label: "All featured" },
  { value: "true", label: "Featured" },
  { value: "false", label: "Not featured" },
];

const firstFilterOptions = [
  { value: BOOL_FILTER_ALL, label: "All first" },
  { value: "true", label: "First" },
  { value: "false", label: "Not first" },
];

const statusFilterOptions = [
  { value: BOOL_FILTER_ALL, label: "All statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Hidden" },
];

export function BlogTable({ posts }: { posts: BlogPost[] }) {
  const [query, setQuery] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState(BOOL_FILTER_ALL);
  const [firstFilter, setFirstFilter] = useState(BOOL_FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(BOOL_FILTER_ALL);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (q) {
        const matchesQuery =
          p.title.toLowerCase().includes(q) || p.authorName.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      if (featuredFilter !== BOOL_FILTER_ALL && String(p.isFeatured) !== featuredFilter) return false;
      if (firstFilter !== BOOL_FILTER_ALL && String(p.isFirst) !== firstFilter) return false;
      if (statusFilter !== BOOL_FILTER_ALL && String(p.isActive) !== statusFilter) return false;
      return true;
    });
  }, [posts, query, featuredFilter, firstFilter, statusFilter]);

  const { page, pageSize, paged, total, setPage, setPageSize } = useAdminPagination(filtered);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-muted-300 bg-surface-0 py-2 pl-9 pr-3 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
        </div>

        <div className="w-36">
          <SingleSelectDropdown
            options={featuredFilterOptions}
            value={featuredFilter}
            onChange={setFeaturedFilter}
            placeholder="All featured"
          />
        </div>

        <div className="w-32">
          <SingleSelectDropdown
            options={firstFilterOptions}
            value={firstFilter}
            onChange={setFirstFilter}
            placeholder="All first"
          />
        </div>

        <div className="w-36">
          <SingleSelectDropdown
            options={statusFilterOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All statuses"
          />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              <th className="px-4 py-3">Cover</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">First</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
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
                <td className="px-4 py-3 text-muted-600">{post.authorName}</td>
                <td className="px-4 py-3 text-muted-600">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <AdminDropdownSelect
                    endpoint={`/api/admin/blog/${post.id}`}
                    field="isFeatured"
                    value={post.isFeatured}
                    options={[
                      { value: true, label: "Featured" },
                      { value: false, label: "Not featured" },
                    ]}
                    triggerClassName="w-28"
                    badgeClassName={
                      post.isFeatured
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-muted-300 text-muted-500 hover:bg-surface-100"
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <AdminDropdownSelect
                    endpoint={`/api/admin/blog/${post.id}`}
                    field="isFirst"
                    value={post.isFirst}
                    options={[
                      { value: true, label: "First" },
                      { value: false, label: "Not first" },
                    ]}
                    triggerClassName="w-28"
                    badgeClassName={
                      post.isFirst
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-muted-300 text-muted-500 hover:bg-surface-100"
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <AdminDropdownSelect
                    endpoint={`/api/admin/blog/${post.id}`}
                    field="isActive"
                    value={post.isActive}
                    options={[
                      { value: true, label: "Active" },
                      { value: false, label: "Hidden" },
                    ]}
                    triggerClassName="w-20"
                    badgeClassName={
                      post.isActive
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-red-200 bg-red-50 text-red-600"
                    }
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-600">
                  {new Date(post.createdAt).toLocaleDateString()}
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
                <td colSpan={9} className="px-4 py-6 text-center text-muted-500">
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
