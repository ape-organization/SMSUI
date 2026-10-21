import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SaveUserRequest, SystemUser } from '../models/users.models';



@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  list(): Observable<SystemUser[]> {
    return this.http.get<SystemUser[]>(this.baseUrl);
  }

  create(user: SaveUserRequest): Observable<SystemUser> {
    return this.http.post<SystemUser>(this.baseUrl, user);
  }

  update(id: string, user: SaveUserRequest): Observable<SystemUser> {
    return this.http.put<SystemUser>(`${this.baseUrl}/${id}`, user);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
