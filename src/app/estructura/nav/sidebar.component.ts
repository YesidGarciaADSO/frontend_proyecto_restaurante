import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  public sidebar = inject(SidebarService);
  private authService = inject(LoginService);

  constructor(private eRef: ElementRef, private router: Router) {}

  close() {
    this.sidebar.close();
  }

  @HostListener('document:click', ['$event'])
  clickOut(event: Event) {
    if (this.sidebar.isOpen() && !this.eRef.nativeElement.contains(event.target)) {
      this.sidebar.close();
    }
  }

  logout() {
    this.authService.cerrarSesion();
    this.sidebar.close();
    this.router.navigate(['/login']);
  }
}
