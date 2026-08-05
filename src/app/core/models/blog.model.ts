export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  content?: string;
  type: 'Blog' | 'Column'; // Standart Blog veya Köşe Yazısı
  category: string;
  coverImageUrl: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  readTimeMinutes: number;
  publishedAt: string;
  viewCount: number;
  isRestricted?: boolean;
}
