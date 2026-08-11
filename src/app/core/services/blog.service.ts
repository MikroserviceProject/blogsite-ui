import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BlogPost, AdminDeletePostRequest, UpdatePostRequest } from '../models/blog.model';

export interface CreatePostRequest {
    title: string;
    content: string;
    type: 'Blog' | 'Koseyazisi';
    status: 'Draft' | 'Published';
    photo?: File | null;
    tags?: string[];
    authorId: string;
}


@Injectable({
    providedIn: 'root'
})
export class BlogService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.blogApiUrl}/api/posts`;

    getAll(status?: 'Draft' | 'Published', type?: 'Blog' | 'Koseyazisi', authorId?: string, tag?: string): Observable<BlogPost[]> {
        const params: Record<string, string> = {};
        if (status) params['status'] = status;
        if (type) params['type'] = type;
        if (authorId) params['authorId'] = authorId;
        if (tag) params['tag'] = tag;

        return this.http.get<BlogPost[]>(this.apiUrl, { params });
    }

    getByAuthor(authorId: string, status?: 'Draft' | 'Published'): Observable<BlogPost[]> {
        return this.getAll(status, undefined, authorId);
    }

    getById(id: number): Observable<BlogPost> {
        return this.http.get<BlogPost>(`${this.apiUrl}/${id}`);
    }

    create(request: CreatePostRequest): Observable<BlogPost> {
        const formData = new FormData();
        formData.append('Title', request.title);
        formData.append('Content', request.content);
        formData.append('Type', request.type);
        formData.append('Status', request.status);
        if (request.photo) {
            formData.append('photo', request.photo);
        }
        if (request.tags && request.tags.length > 0) {
            request.tags.forEach(tag => formData.append('Tags', tag));
        }
        formData.append('AuthorId', request.authorId);

        return this.http.post<BlogPost>(this.apiUrl, formData);
    }

    update(id: number, request: UpdatePostRequest): Observable<BlogPost> {
        const formData = new FormData();
        formData.append('Title', request.title);
        formData.append('Content', request.content);
        if ((request as any).type) {
            formData.append('Type', (request as any).type);
        }
        formData.append('Status', request.status);
        if (request.photo) {
            formData.append('photo', request.photo);
        }
        if (request.tags && request.tags.length > 0) {
            request.tags.forEach(tag => formData.append('Tags', tag));
        }

        return this.http.put<BlogPost>(`${this.apiUrl}/${id}`, formData);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    adminDelete(id: number, request: AdminDeletePostRequest): Observable<{ success: boolean; message: string }> {
        return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/${id}/admin-delete`, request);
    }

    getPhotoUrl(path: string | undefined): string {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:image')) return path;
        
        return `${environment.blogApiUrl}${path}`;
    }
}