import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getUserById } from "@/lib/data";
import { UserEditForm } from "@/components/admin/UserEditForm";

export default async function EditAdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-950">Edit user</h1>
        <p className="mt-4 text-sm text-muted-500">Only admins can manage users.</p>
      </div>
    );
  }

  const { id } = await params;
  const user = await getUserById(id);
  if (!user) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">
        Edit {user.fullName || user.email}
      </h1>
      <div className="mt-6">
        <UserEditForm user={user} />
      </div>
    </div>
  );
}
