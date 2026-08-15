import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SocialStats {
  followersCount: number;
  followingCount: number;
}

export interface PublicUser {
  id: string;
  username: string;
  profilePictureUrl: string | null;
  coverPictureUrl: string | null;
  role: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[] | null;
}

@Injectable({
  providedIn: 'root'
})
export class SocialService {
  private http = inject(HttpClient);
  private socialUrl = environment.socialApiUrl + '/api/social';
  private authUrl = environment.authApiUrl + '/api/auth/public/profile';

  // Get public profile (from Authentication.API)
  getPublicProfile(username: string): Observable<ApiResponse<PublicUser>> {
    return this.http.get<ApiResponse<PublicUser>>(`${this.authUrl}/${username}`);
  }

  // Search users (from Authentication.API)
  searchUsers(query: string): Observable<ApiResponse<PublicUser[]>> {
    const searchUrl = environment.authApiUrl + '/api/auth/public/search-users';
    return this.http.get<ApiResponse<PublicUser[]>>(`${searchUrl}?query=${query}`);
  }

  // Get stats (from Social.API)
  getUserStats(userId: string): Observable<ApiResponse<SocialStats>> {
    return this.http.get<ApiResponse<SocialStats>>(`${this.socialUrl}/stats/${userId}`);
  }

  // Follow
  followUser(followingId: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.socialUrl}/follow/${followingId}`, {});
  }

  // Unfollow
  unfollowUser(followingId: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.socialUrl}/unfollow/${followingId}`, {});
  }

  // Check follow status
  checkFollowStatus(followingId: string): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.socialUrl}/check-follow/${followingId}`);
  }

  // Get Followers IDs
  getFollowersIds(userId: string): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.socialUrl}/followers-ids/${userId}`);
  }

  // Get Following IDs
  getFollowingIds(userId: string): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.socialUrl}/following-ids/${userId}`);
  }

  // Get Bulk Profiles (from Authentication.API)
  getBulkProfiles(userIds: string[]): Observable<ApiResponse<PublicUser[]>> {
    const bulkUrl = environment.authApiUrl + '/api/auth/public/bulk-profiles';
    return this.http.post<ApiResponse<PublicUser[]>>(bulkUrl, userIds);
  }
}
