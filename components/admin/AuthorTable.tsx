import Link from "next/link";
import { Pencil } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminDropdownSelect } from "@/components/admin/AdminDropdownSelect";
import type { Author } from "@/types";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AuthorTable({ authors }: { authors: Author[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-muted-200 bg-surface-0">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-100 text-xs uppercase text-muted-500">
          <tr>
            <th className="px-4 py-3">Avatar</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Job title</th>
            <th className="px-4 py-3">Default</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {authors.map((author) => (
            <tr key={author.id} className="border-t border-muted-200">
              <td className="px-4 py-3">
                {author.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-configured avatar can be any external URL, outside next/image's remotePatterns allowlist
                  <img
                    src={author.avatarUrl}
                    alt={author.name}
                    className="h-11 w-11 rounded-full border border-muted-200 bg-surface-100 object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                    {initials(author.name) || "?"}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 font-medium text-brand-950">{author.name}</td>
              <td className="px-4 py-3 text-muted-600">{author.jobTitle || "—"}</td>
              <td className="px-4 py-3">
                <AdminDropdownSelect
                  endpoint={`/api/admin/settings/author/${author.id}`}
                  field="isDefault"
                  value={author.isDefault}
                  options={[
                    { value: true, label: "Default" },
                    { value: false, label: "Not default" },
                  ]}
                  triggerClassName="w-28"
                  badgeClassName={
                    author.isDefault
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-muted-300 text-muted-500 hover:bg-surface-100"
                  }
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/settings/author/${author.id}`}
                    aria-label={`Edit ${author.name}`}
                    className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton
                    endpoint={`/api/admin/settings/author/${author.id}`}
                    confirmLabel={author.name}
                  />
                </div>
              </td>
            </tr>
          ))}
          {authors.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-muted-500">
                No authors yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
