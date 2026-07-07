import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { getAllUsers } from "@/lib/data";
import { UsersTable } from "@/components/admin/UsersTable";

export default async function AdminUsersSettingsPage() {
  const [session, users] = await Promise.all([auth(), getAllUsers()]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950">Users</h1>
          <p className="mt-1 text-sm text-muted-500">{users.length} admin users.</p>
        </div>
        <Link
          href="/admin/settings/users/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add User
        </Link>
      </div>

      <div className="mt-6">
        <UsersTable users={users} currentUserId={session?.user?.id} />
      </div>
    </div>
  );
}
