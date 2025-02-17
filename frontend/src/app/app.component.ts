import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ opacity: 0, transform: 'scale(0.9) translateY(30px) rotateX(20deg)' }), // More dramatic start
        animate('1000ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0) rotateX(0)' })) // Slower and more visible
      ])
    ])
  ]
})
export class AppComponent {
  title = 'frontend';

  // Tells Angular to apply animations when routing
  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }
}
