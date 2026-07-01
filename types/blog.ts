export interface BlogSeo {
  title: string;
  description: string;
}

export interface BlogAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  author: BlogAuthor;
  tags: string[];
  categoryId?: string;
  body: string;
  readingMinutes: number;
  publishedAt: string;
  seo: BlogSeo;
  isFeatured: boolean;
}
