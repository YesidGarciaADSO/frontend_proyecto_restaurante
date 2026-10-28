import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { LoginService } from '../../services/login.service';
import { AjustesService } from '../../services/ajustes.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  public sidebar = inject(SidebarService);
  public authService = inject(LoginService);
  private ajustesService = inject(AjustesService);

  constructor(private eRef: ElementRef, private router: Router) {}

  get nombreRestaurante(): string {
    return this.ajustesService.obtenerAjustes().negocio.nombre || 'Restaurante';
  }

  get rolActual(): string {
    return this.authService.obtenerRol();
  }

  puedeVer(ruta: string): boolean {
    return this.authService.tienePermisoRuta(ruta);
  }

  get tieneSeccionAtencion(): boolean {
    return (
      this.puedeVer('dashboard') ||
      this.puedeVer('pedidos') ||
      this.puedeVer('domiciliario') ||
      this.puedeVer('clientes')
    );
  }

  get tieneSeccionCatalogo(): boolean {
    return (
      this.puedeVer('productos') ||
      this.puedeVer('categorias') ||
      this.puedeVer('proveedores') ||
      this.puedeVer('inventario')
    );
  }

  get tieneSeccionAdministracion(): boolean {
    return (
      this.puedeVer('ventas') ||
      this.puedeVer('pagos') ||
      this.puedeVer('usuarios') ||
      this.puedeVer('ajustes')
    );
  }

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
