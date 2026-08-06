import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BlogPost } from '../models/blog.model';

export interface CreatePostRequest {
    title: string;
    content: string;
    type: 'Blog' | 'Koseyazisi';
    status: 'Draft' | 'Published';
    photo?: File | null;
}

@Injectable({
    providedIn: 'root'
})
export class BlogService {
    private http = inject(HttpClient);
    private apiUrl = 'https://localhost:7296/api/posts';

    getAll(status?: 'Draft' | 'Published', type?: 'Blog' | 'Koseyazisi'): Observable<BlogPost[]> {
        const params: Record<string, string> = {};
        if (status) params['status'] = status;
        if (type) params['type'] = type;

        return this.http.get<BlogPost[]>(this.apiUrl, { params });
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

        return this.http.post<BlogPost>(this.apiUrl, formData);
    }
}