import { unstable_cache } from "next/cache";
import { prisma, Prisma } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/security/password";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import type { AdminUser, AdminRole, AdminUserStatus } from "@/types";
import type { User as PrismaUser } from "@prisma/client";

function toAdminUser(row: PrismaUser): AdminUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role as AdminRole,
    status: row.status as AdminUserStatus,
    fullName: row.fullName ?? undefined,
    avatarUrl: row.avatarUrl ?? undefined,
    phone: row.phone ?? undefined,
    permissions: row.permissions,
    fullDataAccess: row.fullDataAccess,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Small, security-sensitive table — always read fresh, no unstable_cache.
export async function getAllUsers(): Promise<AdminUser[]> {
  const rows = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(toAdminUser);
}

export async function getUserById(id: string): Promise<AdminUser | undefined> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? toAdminUser(row) : undefined;
}

export async function getUserByEmail(email: string): Promise<AdminUser | undefined> {
  const row = await prisma.user.findUnique({ where: { email } });
  return row ? toAdminUser(row) : undefined;
}

// Polled every 20s by AccountStatusWatcher — a plain findUnique here was the
// dominant cost of every admin page transition. Short-TTL cache (not full
// freshness like getUserById above, which is used for permission-critical
// reads) is safe for this narrow self-monitoring check: updateUserStatus and
// deleteUser purge the tag below, so an actual deactivation still lands
// within seconds, not up to the 30s TTL.
export async function getUserActiveStatus(id: string): Promise<boolean> {
  return unstable_cache(
    async () => {
      const row = await prisma.user.findUnique({ where: { id }, select: { status: true } });
      return row?.status === "ACTIVE";
    },
    [`user-status:${id}`],
    { tags: [`user-status:${id}`], revalidate: 30 }
  )();
}

export async function countAdmins(excludeId?: string): Promise<number> {
  return prisma.user.count({
    where: { role: "ADMIN", ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
}

export async function countActiveAdmins(excludeId?: string): Promise<number> {
  return prisma.user.count({
    where: {
      role: "ADMIN",
      status: "ACTIVE",
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

export interface CreateUserFields {
  email: string;
  role: AdminRole;
  password: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  permissions?: string[];
  fullDataAccess?: string[];
}

export async function createUser(fields: CreateUserFields): Promise<AdminUser> {
  try {
    const hashedPassword = await hashPassword(fields.password);
    const row = await prisma.user.create({
      data: {
        email: fields.email,
        role: fields.role,
        hashedPassword,
        fullName: fields.fullName,
        avatarUrl: fields.avatarUrl || null,
        phone: fields.phone || null,
        // Permissions/full-data-access are only meaningful for EDITOR — ADMIN always has full access.
        permissions: fields.role === "EDITOR" ? (fields.permissions ?? []) : [],
        fullDataAccess: fields.role === "EDITOR" ? (fields.fullDataAccess ?? []) : [],
      },
    });
    return toAdminUser(row);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      (error.meta?.target as string[] | undefined)?.includes("email")
    ) {
      throw new Error("EMAIL_TAKEN");
    }
    throw error;
  }
}

export interface UpdateUserFields {
  email: string;
  role: AdminRole;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  password?: string;
  permissions?: string[];
  fullDataAccess?: string[];
}

export async function updateUser(id: string, fields: UpdateUserFields): Promise<AdminUser> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (existing?.role === "ADMIN" && fields.role === "EDITOR") {
    const remaining = await countAdmins(id);
    if (remaining === 0) throw new Error("LAST_ADMIN");
  }

  try {
    const hashedPassword = fields.password ? await hashPassword(fields.password) : undefined;
    const row = await prisma.user.update({
      where: { id },
      data: {
        email: fields.email,
        role: fields.role,
        fullName: fields.fullName,
        avatarUrl: fields.avatarUrl || null,
        phone: fields.phone || null,
        permissions: fields.role === "EDITOR" ? (fields.permissions ?? []) : [],
        fullDataAccess: fields.role === "EDITOR" ? (fields.fullDataAccess ?? []) : [],
        ...(hashedPassword ? { hashedPassword } : {}),
      },
    });
    return toAdminUser(row);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      (error.meta?.target as string[] | undefined)?.includes("email")
    ) {
      throw new Error("EMAIL_TAKEN");
    }
    throw error;
  }
}

export async function updateUserRole(id: string, role: AdminRole): Promise<AdminUser> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (existing?.role === "ADMIN" && role === "EDITOR") {
    const remaining = await countAdmins(id);
    if (remaining === 0) throw new Error("LAST_ADMIN");
  }
  const row = await prisma.user.update({ where: { id }, data: { role } });
  return toAdminUser(row);
}

export async function updateUserStatus(
  id: string,
  status: AdminUserStatus,
  actingUserId: string
): Promise<AdminUser> {
  if (id === actingUserId && status === "INACTIVE") throw new Error("CANNOT_DEACTIVATE_SELF");

  const existing = await prisma.user.findUnique({ where: { id } });
  if (existing?.role === "ADMIN" && existing.status === "ACTIVE" && status === "INACTIVE") {
    const remaining = await countActiveAdmins(id);
    if (remaining === 0) throw new Error("LAST_ADMIN");
  }

  const row = await prisma.user.update({ where: { id }, data: { status } });
  purgeTag(`user-status:${id}`);
  return toAdminUser(row);
}

export async function setUserPassword(id: string, newPassword: string): Promise<void> {
  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({ where: { id }, data: { hashedPassword } });
}

export async function deleteUser(id: string, actingUserId: string): Promise<void> {
  if (id === actingUserId) throw new Error("CANNOT_DELETE_SELF");

  const existing = await prisma.user.findUnique({ where: { id } });
  if (existing?.role === "ADMIN") {
    const remaining = await countAdmins(id);
    if (remaining === 0) throw new Error("LAST_ADMIN");
  }

  await prisma.user.delete({ where: { id } });
  purgeTag(`user-status:${id}`);
}
