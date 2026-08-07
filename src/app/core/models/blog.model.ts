export interface BlogPost {
  id: number;
  title: string;
  content: string;
  type: 'Blog' | 'Koseyazisi';
  status: 'Draft' | 'Published';
  photoUrl: string | null;
  authorId: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminDeletePostRequest {
  reason: string;
  sendEmailNotification?: boolean;
}

export interface UpdatePostRequest {
  title: string;
  content: string;
  type: 'Blog' | 'Koseyazisi';
  status: 'Draft' | 'Published';
  photo?: File | null;
}