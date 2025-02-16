import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isLoggedIn: boolean = false;
  dropdownOpen: boolean = false;
  userProfileImage: string = ''; // Store user's profile image

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.isAuthenticated().subscribe(status => {
      this.isLoggedIn = status;
      if (this.isLoggedIn) {
        this.userProfileImage = this.authService.getProfileImage();
      }
    });
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  logout(): void {
    this.authService.logout();
    this.dropdownOpen = false;
    this.isLoggedIn = false;
  }
}
