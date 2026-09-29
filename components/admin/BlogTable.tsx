"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { usePathname, useSearchParams } from "next/navigation";
import { Columns as ColumnsIcon, Pencil, Search } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminDropdownSelect } from "@/components/admin/AdminDropdownSelect";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { SingleSelectDropdown } from "@/components/admin/SingleSelectDropdown";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { buildQueryUrl, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { BlogPost, BlogTopic, Category } from "@/types";

const SCROLL_STORAGE_KEY = "admin-blog-scroll-y";
const LAST_EDITED_BLOG_KEY = "admin-blog-last-id";

const BOOL_FILTER_ALL = "all";

// The columns currently shown are locked defaults; the Columns picker only
// adds these extra fields, all off by default. The table scrolls horizontally
// when many are enabled.
const OPTIONAL_COLUMNS = [
  { key: "category", label: "Category" },
  { key: "topic", label: "Topic" },
  { key: "readingMinutes", label: "Reading Minutes" },
] as const;
type OptionalColumnKey = (typeof OPTIONAL_COLUMNS)[number]["key"];
const DEFAULT_LOCKED_COLUMNS = [
  "Cover",
  "Title",
  "Author",
  "Published",
  "Featured",
  "First",
  "Status",
  "Date",
  "Actions",
];

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
  categories,
  topics,
  total,
  page,
  pageSize,
}: {
  posts: BlogPost[];
  categories: Category[];
  topics: BlogTopic[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );
  const topicNameById = useMemo(() => new Map(topics.map((t) => [t.id, t.name])), [topics]);

  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<OptionalColumnKey>>(new Set());
  const [draftVisibleColumns, setDraftVisibleColumns] = useState<Set<OptionalColumnKey>>(new Set());

  function openColumnsModal() {
    setDraftVisibleColumns(new Set(visibleColumns));
    setShowColumnsModal(true);
  }

  function toggleDraftColumn(key: OptionalColumnKey) {
    setDraftVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function applyColumns() {
    setVisibleColumns(draftVisibleColumns);
    setShowColumnsModal(false);
  }

  const featuredFilter = searchParams.get("featured") ?? BOOL_FILTER_ALL;
  const firstFilter = searchParams.get("first") ?? BOOL_FILTER_ALL;
  const statusFilter = searchParams.get("status") ?? BOOL_FILTER_ALL;
  const urlQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(urlQuery);
  const debouncedQuery = useDebouncedValue(query);

  function navigate(updates: Record<string, string | undefined>) {
    router.push(buildQueryUrl(pathname, searchParams, updates));
  }

  const currentListUrl = searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname;
  const [highlightedBlogId, setHighlightedBlogId] = useState<string | null>(null);

  useEffect(() => {
    const shouldScrollTop = sessionStorage.getItem("admin-blog-scroll-top");
    if (shouldScrollTop) {
      sessionStorage.removeItem("admin-blog-scroll-top");
      sessionStorage.removeItem(SCROLL_STORAGE_KEY);
      sessionStorage.removeItem(LAST_EDITED_BLOG_KEY);
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }

    const savedY = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    const lastId = sessionStorage.getItem(LAST_EDITED_BLOG_KEY);
    if (!savedY && !lastId) return;

    const restore = () => {
      if (lastId) {
        const row = document.getElementById(`blog-row-${lastId}`);
        if (row) {
          row.scrollIntoView({ block: "center", behavior: "instant" });
          setHighlightedBlogId(lastId);
          setTimeout(() => setHighlightedBlogId(null), 2500);
          sessionStorage.removeItem(SCROLL_STORAGE_KEY);
          sessionStorage.removeItem(LAST_EDITED_BLOG_KEY);
          return true;
        }
      }
      if (savedY) {
        window.scrollTo({ top: Number(savedY), behavior: "instant" });
        sessionStorage.removeItem(SCROLL_STORAGE_KEY);
        sessionStorage.removeItem(LAST_EDITED_BLOG_KEY);
        return true;
      }
      return false;
    };

    if (!restore()) {
      const raf = requestAnimationFrame(() => {
        if (!restore()) {
          const timer = setTimeout(restore, 100);
          return () => clearTimeout(timer);
        }
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [posts]);

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

        <button
          type="button"
          onClick={openColumnsModal}
          className="flex items-center gap-1.5 rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm font-medium text-brand-950 hover:bg-surface-100"
        >
          <ColumnsIcon className="h-4 w-4" />
          Columns
        </button>
      </div>

      <Modal open={showColumnsModal} onOpenChange={setShowColumnsModal}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-brand-950">Columns</h2>
          <button
            type="button"
            onClick={() => setDraftVisibleColumns(new Set())}
            className="text-sm font-medium text-red-600 hover:underline"
          >
            Reset
          </button>
        </div>

        <div className="space-y-3">
          {DEFAULT_LOCKED_COLUMNS.map((label) => (
            <label key={label} className="flex items-center gap-2 text-sm text-muted-400">
              <input type="checkbox" checked disabled className="h-4 w-4" />
              {label}
            </label>
          ))}
          {OPTIONAL_COLUMNS.map((col) => (
            <label key={col.key} className="flex items-center gap-2 text-sm text-brand-950">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={draftVisibleColumns.has(col.key)}
                onChange={() => toggleDraftColumn(col.key)}
              />
              {col.label}
            </label>
          ))}
        </div>

        <Button variant="primary" className="mt-5 w-full" onClick={applyColumns}>
          Apply columns
        </Button>
      </Modal>

      <div className="mt-4 overflow-x-auto rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              <th className="px-4 py-3">Cover</th>
              <th className="w-64 min-w-64 px-4 py-3">Title</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">First</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              {visibleColumns.has("category") && <th className="px-4 py-3">Category</th>}
              {visibleColumns.has("topic") && <th className="px-4 py-3">Topic</th>}
              {visibleColumns.has("readingMinutes") && (
                <th className="px-4 py-3">Reading Minutes</th>
              )}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr
                key={post.id}
                id={`blog-row-${post.id}`}
                className={cn(
                  "border-t border-muted-200 transition-colors duration-1000",
                  highlightedBlogId === post.id && "bg-brand-50"
                )}
              >
                <td className="px-4 py-3">
                  <div className="relative h-10 w-16 overflow-hidden rounded border border-muted-200 bg-surface-100">
                    <Image src={post.coverImage} alt={post.title} fill sizes="64px" className="object-cover" />
                  </div>
                </td>
                <td className="w-64 min-w-64 max-w-64 px-4 py-3 font-medium text-brand-950">
                  <span className="line-clamp-2">{post.title}</span>
                </td>
                <td className="px-4 py-3 text-muted-600">{post.authorName}</td>
                <td className="px-4 py-3 text-muted-600">
                  {new Date(post.publishedAt).toLocaleDateString("en-US")}
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
                  {new Date(post.createdAt).toLocaleDateString("en-US")}
                </td>
                {visibleColumns.has("category") && (
                  <td className="px-4 py-3 text-muted-600">
                    {post.categoryId ? categoryNameById.get(post.categoryId) ?? "—" : "—"}
                  </td>
                )}
                {visibleColumns.has("topic") && (
                  <td className="px-4 py-3 text-muted-600">
                    {post.topicId ? topicNameById.get(post.topicId) ?? "—" : "—"}
                  </td>
                )}
                {visibleColumns.has("readingMinutes") && (
                  <td className="whitespace-nowrap px-4 py-3 text-muted-600">
                    {post.readingMinutes} min
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/blog/${post.id}?from=${encodeURIComponent(currentListUrl)}`}
                      prefetch={false}
                      onClick={() => {
                        sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
                        sessionStorage.setItem(LAST_EDITED_BLOG_KEY, post.id);
                      }}
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
                <td
                  colSpan={9 + visibleColumns.size}
                  className="px-4 py-6 text-center text-muted-500"
                >
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
