import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SESSION_KEY = 'rl_auth';

  login(username: string, password: string): boolean {
    if (
      username === environment.auth.username &&
      password === environment.auth.password
    ) {
      sessionStorage.setItem(this.SESSION_KEY, 'true');
      return true;
    }
    return false;
  }

  logout(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  isAuthenticated(): boolean {
    return sessionStorage.getItem(this.SESSION_KEY) === 'true';
  }
}
