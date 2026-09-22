import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { LoginService } from '../../services/login.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html'
})
export class Header implements OnInit {
  private router = inject(Router);
  public sidebar = inject(SidebarService);
  private authService = inject(LoginService);

  public usuarioSesion: any = null;

  ngOnInit() {
    this.usuarioSesion = this.authService.obtenerUsuario();
  }

  logout() {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
