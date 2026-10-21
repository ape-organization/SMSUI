import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiToken, CreateApiTokenRequest, CreatedApiToken, UpdateApiTokenRequest } from '../models/api-integration.models';


@Injectable({ providedIn: 'root' })
export class ApiIntegrationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api-tokens`;

  list(): Observable<ApiToken[]> {
    return this.http.get<ApiToken[]>(this.baseUrl);
  }

  create(request: CreateApiTokenRequest): Observable<CreatedApiToken> {
    return this.http.post<CreatedApiToken>(this.baseUrl, request);
  }

  rename(id: string, request: UpdateApiTokenRequest): Observable<ApiToken> {
    return this.http.patch<ApiToken>(`${this.baseUrl}/${id}`, request);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
