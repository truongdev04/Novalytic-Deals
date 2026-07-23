"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { usePathname, useSearchParams } from "next/navigation";
import { Pencil, Search } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminDropdownSelect } from "@/components/admin/AdminDropdownSelect";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { SingleSelectDropdown } from "@/components/admin/SingleSelectDropdown";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { buildQueryUrl } from "@/lib/utils";
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
  { value: "active", label: "Active" },
  { value: "hidden", label: "Hidden" },
];

export function BlogTable({
  posts,
  total,
  page,
  pageSize,
}: {
  posts: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const featuredFilter = searchParams.get("featured") ?? BOOL_FILTER_ALL;
  const firstFilter = searchParams.get("first") ?? BOOL_FILTER_ALL;
  const statusFilter = searchParams.get("status") ?? BOOL_FILTER_ALL;
  const urlQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(urlQuery);
  const debouncedQuery = useDebouncedValue(query);

  function navigate(updates: Record<string, string | undefined>) {
    router.push(buildQueryUrl(pathname, searchParams, updates));
  }

  useEffect(() => {
    if (debouncedQuery === urlQuery) return;
    navigate({ q: debouncedQuery || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

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
            onChange={(value) => navigate({ featured: value === BOOL_FILTER_ALL ? undefined : value })}
            placeholder="All featured"
          />
        </div>

        <div className="w-32">
          <SingleSelectDropdown
            options={firstFilterOptions}
            value={firstFilter}
            onChange={(value) => navigate({ first: value === BOOL_FILTER_ALL ? undefined : value })}
            placeholder="All first"
          />
        </div>

        <div className="w-36">
          <SingleSelectDropdown
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(value) => navigate({ status: value === BOOL_FILTER_ALL ? undefined : value })}
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
            {posts.map((post) => (
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
            {posts.length === 0 && (
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
        onPageChange={(p) => navigate({ page: String(p) })}
        onPageSizeChange={(size) => navigate({ size: String(size), page: undefined })}
      />
    </div>
  );
}
