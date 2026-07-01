export interface Review {
  id: string;
  storeId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  isApproved: boolean;
  createdAt: string;
}
