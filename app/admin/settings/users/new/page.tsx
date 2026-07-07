import { UserForm } from "@/components/admin/UserForm";

export default function NewAdminUserPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">New user</h1>
      <div className="mt-6">
        <UserForm />
      </div>
    </div>
  );
}
