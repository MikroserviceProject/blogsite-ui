export interface BlogPost {
  id: number;
  title: string;
  content: string;
  type: 'Blog' | 'Koseyazisi';
  status: 'Draft' | 'Published';
  photoUrl: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string | null;
}