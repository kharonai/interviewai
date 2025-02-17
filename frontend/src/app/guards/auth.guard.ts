import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // If the user is logged in and is trying to access /home, redirect to /dashboard.
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && state.url === '/home') {
      this.router.navigate(['/dashboard']);
      return false;
    }
    return true;
  }
}
