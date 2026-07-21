export interface BlogSeo {
  title: string;
  description: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  authorName: string;
  authorAvatarUrl?: string;
  categoryId?: string;
  topicId?: string;
  body: string;
  readingMinutes: number;
  publishedAt: string;
  seo: BlogSeo;
  isFeatured: boolean;
  isFirst: boolean;
  isActive: boolean;
  createdAt: string;
}
