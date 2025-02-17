import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isLoggedIn: boolean = false;
  dropdownOpen: boolean = false;
  private closeDropdownTimer: any;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.isAuthenticated().subscribe(status => {
      this.isLoggedIn = status;
    });
  }

  toggleDropdown(open: boolean): void {
    if (open) {
      if (this.closeDropdownTimer) {
        clearTimeout(this.closeDropdownTimer);
      }
      this.dropdownOpen = true;
    } else {
      // Delay closing the dropdown for 300ms so user can move into it
      this.closeDropdownTimer = setTimeout(() => {
        this.dropdownOpen = false;
      }, 300);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
