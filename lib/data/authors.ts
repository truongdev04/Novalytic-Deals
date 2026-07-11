import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma, Prisma } from "@/lib/server/db";
import type { Author } from "@/types";

const AUTHORS_KEY = "authors";

function isValidAuthors(value: unknown): value is Author[] {
  return (
    Array.isArray(value) &&
    value.every(
      (a) => a && typeof a === "object" && typeof (a as Author).id === "string" && (a as Author).id.length > 0
    )
  );
}

async function readAuthorsRaw(): Promise<Author[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: AUTHORS_KEY } });
  const stored = row?.value as unknown as { authors?: unknown } | null;
  return isValidAuthors(stored?.authors) ? stored.authors : [];
}

async function writeAuthorsRaw(authors: Author[]): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: AUTHORS_KEY },
    create: { key: AUTHORS_KEY, value: { authors } as unknown as Prisma.InputJsonValue },
    update: { value: { authors } as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:authors");
}

export const getAuthors = unstable_cache(readAuthorsRaw, ["settings:authors"], {
  tags: ["settings:authors"],
  revalidate: 300,
});

export async function getAuthorById(id: string): Promise<Author | null> {
  const authors = await getAuthors();
  return authors.find((a) => a.id === id) ?? null;
}

export async function getDefaultAuthor(): Promise<Author | null> {
  const authors = await getAuthors();
  return authors.find((a) => a.isDefault) ?? authors[0] ?? null;
}

export interface AuthorFields {
  name: string;
  avatarUrl?: string;
  jobTitle?: string;
  bio?: string;
  isDefault: boolean;
}

export async function createAuthor(fields: AuthorFields): Promise<Author> {
  const current = await readAuthorsRaw();
  const author: Author = { id: crypto.randomUUID(), ...fields };
  let next = [...current, author];
  if (author.isDefault) {
    next = next.map((a) => (a.id === author.id ? a : { ...a, isDefault: false }));
  }
  await writeAuthorsRaw(next);
  return author;
}

export async function updateAuthor(id: string, fields: AuthorFields): Promise<Author | null> {
  const current = await readAuthorsRaw();
  if (!current.some((a) => a.id === id)) return null;
  let next = current.map((a) => (a.id === id ? { id, ...fields } : a));
  if (fields.isDefault) {
    next = next.map((a) => (a.id === id ? a : { ...a, isDefault: false }));
  }
  await writeAuthorsRaw(next);
  return next.find((a) => a.id === id) ?? null;
}

export async function setAuthorDefault(id: string, isDefault: boolean): Promise<Author | null> {
  const current = await readAuthorsRaw();
  if (!current.some((a) => a.id === id)) return null;
  const next = current.map((a) => ({ ...a, isDefault: a.id === id ? isDefault : false }));
  await writeAuthorsRaw(next);
  return next.find((a) => a.id === id) ?? null;
}

export async function deleteAuthor(id: string): Promise<void> {
  const current = await readAuthorsRaw();
  await writeAuthorsRaw(current.filter((a) => a.id !== id));
}
