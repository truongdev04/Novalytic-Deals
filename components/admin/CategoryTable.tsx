"use client";

import Link from "next/link";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminPagination } from "@/lib/hooks/useAdminPagination";
import type { Category } from "@/types";

export function CategoryTable({ categories }: { categories: Category[] }) {
  const { page, pageSize, paged, total, setPage, setPageSize } = useAdminPagination(categories);

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {paged.map((category) => (
              <tr key={category.id} className="border-t border-muted-200">
                <td className="px-4 py-3 font-medium text-brand-950">{category.name}</td>
                <td className="px-4 py-3 text-muted-600">{category.slug}</td>
                <td className="px-4 py-3">{category.isFeatured ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/categories/${category.id}`}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <DeleteButton
                      endpoint={`/api/admin/categories/${category.id}`}
                      confirmLabel={category.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-500">
                  No categories found.
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
