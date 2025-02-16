import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  iconsLoaded = false;

  constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
      // If user is logged in, redirect them to the Dashboard
      this.authService.isAuthenticated().subscribe(isLoggedIn => {
        if (isLoggedIn) {
          this.router.navigate(['/dashboard']);
        }
      });
    setTimeout(() => {
      this.iconsLoaded = true;
      this.cdr.detectChanges(); // ✅ Force Angular to update the UI
    }, 0);
  }
}
