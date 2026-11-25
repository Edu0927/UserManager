import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  User,
  UserRequest,
  UserUpdateRequest,
  UserStatusRequest
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/users`;

  // LIST USERS
  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // GET USER
  getById(id: number): Observable<User> {
    return this.http.get<User>(
      `${this.apiUrl}/${id}`
    );
  }

  // CREATE USER
  create(user: UserRequest): Observable<User> {
    return this.http.post<User>(
      this.apiUrl,
      user
    );
  }

  // UPDATE USER
  update(
    id: number,
    user: UserUpdateRequest
  ): Observable<User> {

    return this.http.put<User>(
      `${this.apiUrl}/${id}`,
      user
    );
  }

  // DELETE USER
  delete(id: number): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }

  // UPDATE STATUS
  updateStatus(
    id: number,
    active: boolean
  ): Observable<User> {

    const body: UserStatusRequest = {
      active
    };

    return this.http.patch<User>(
      `${this.apiUrl}/${id}/status`,
      body
    );
  }
}
