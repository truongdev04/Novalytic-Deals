"use client";

import { useMemo, useState } from "react";
import { KeyRound } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminDropdownSelect } from "@/components/admin/AdminDropdownSelect";
import { ResetPasswordModal } from "@/components/admin/ResetPasswordModal";
import type { AdminUser } from "@/types";

export function UsersTable({ users, currentUserId }: { users: AdminUser[]; currentUserId?: string }) {
  const [resetPasswordFor, setResetPasswordFor] = useState<AdminUser | null>(null);

  const sorted = useMemo(
    () => [...users].sort((a, b) => a.email.localeCompare(b.email)),
    [users]
  );

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((user) => (
              <tr key={user.id} className="border-t border-muted-200">
                <td className="px-4 py-3 font-medium text-brand-950">
                  {user.email}
                  {user.id === currentUserId && (
                    <span className="ml-2 text-xs font-normal text-muted-500">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <AdminDropdownSelect
                    endpoint={`/api/admin/users/${user.id}`}
                    field="role"
                    value={user.role}
                    options={[
                      { value: "ADMIN", label: "Admin" },
                      { value: "EDITOR", label: "Editor" },
                    ]}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setResetPasswordFor(user)}
                      aria-label={`Reset password for ${user.email}`}
                      className="rounded-lg p-1.5 text-muted-500 hover:bg-surface-100 hover:text-brand-900"
                    >
                      <KeyRound className="h-4 w-4" />
                    </button>
                    <DeleteButton
                      endpoint={`/api/admin/users/${user.id}`}
                      confirmLabel={user.email}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ResetPasswordModal
        user={resetPasswordFor}
        onOpenChange={(open) => {
          if (!open) setResetPasswordFor(null);
        }}
      />
    </div>
  );
}
