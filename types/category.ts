export interface CategorySeo {
  title: string;
  description: string;
}

export interface CategoryFaqItem {
  question: string;
  answer: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconName: string;
  parentId?: string;
  isFeatured: boolean;
  seo: CategorySeo;
  faq: CategoryFaqItem[];
}
