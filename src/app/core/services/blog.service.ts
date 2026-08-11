import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BlogPost, AdminDeletePostRequest, UpdatePostRequest } from '../models/blog.model';

export interface PagedPosts {
    posts: BlogPost[];
    totalCount: number;
}

export interface PagedResultDto<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface ApiResponseDto<T> {
    success: boolean;
    message: string | null;
    data: T;
}

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

    getAll(status?: 'Draft' | 'Published', type?: 'Blog' | 'Koseyazisi', authorId?: string, search?: string, tag?: string): Observable<BlogPost[]> {
        const params: Record<string, string> = {};
        if (status) params['status'] = status;
        if (type) params['type'] = type;
        if (authorId) params['authorId'] = authorId;
        if (search) params['search'] = search;
        if (tag) params['tag'] = tag;

        return this.http.get<BlogPost[]>(this.apiUrl, { params });
    }

    getByAuthor(authorId: string, status?: 'Draft' | 'Published'): Observable<BlogPost[]> {
        return this.getAll(status, undefined, authorId);
    }

    getAllPaged(
        status: 'Draft' | 'Published' | undefined,
        type: 'Blog' | 'Koseyazisi' | undefined,
        search: string | undefined,
        page: number,
        pageSize: number,
        tag?: string
    ): Observable<PagedPosts> {
        const params: Record<string, string> = {
            page: String(page),
            pageSize: String(pageSize)
        };
        if (status) params['status'] = status;
        if (type) params['type'] = type;
        if (search) params['search'] = search;
        if (tag) params['tag'] = tag;

        return this.http.get<ApiResponseDto<PagedResultDto<BlogPost>>>(`${this.apiUrl}/paged`, { params }).pipe(
            map(response => ({
                posts: response.data.items,
                totalCount: response.data.totalCount
            }))
        );
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
        if (request.type) {
            formData.append('Type', request.type);
        }
        formData.append('Status', request.status);
        if (request.photo) {
            formData.append('photo', request.photo);
        }
        if (request.removePhoto) {
            formData.append('RemovePhoto', 'true');
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
