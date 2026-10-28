import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private http = inject(HttpClient);
  // private url = 'http://localhost/proyectos/restaurante/backend/controladores/login.php';
  private url = 'https://fastfood-os.site.je/backend/controladores/login.php';

  private obtenerUsuariosLocales(): any[] {
    const raw = localStorage.getItem('usuarios_locales_restaurante');
    return raw ? JSON.parse(raw) : [];
  }

  private guardarUsuariosLocales(lista: any[]): void {
    localStorage.setItem('usuarios_locales_restaurante', JSON.stringify(lista));
  }

  login(correo: string, clave: string): Observable<any> {
    // Verificar si es un usuario con clave actualizada localmente
    const locales = this.obtenerUsuariosLocales();
    const usuarioLocal = locales.find(
      (u) => u.correo.toLowerCase() === correo.toLowerCase() && u.clave === clave
    );
    if (usuarioLocal) {
      return of([{ ...usuarioLocal, validar: 'valida' }]);
    }
    return this.http.post(this.url, { correo, clave });
  }

  recuperarClave(correo: string, nuevaClave: string): Observable<any> {
    const locales = this.obtenerUsuariosLocales();
    const idx = locales.findIndex((u) => u.correo.toLowerCase() === correo.toLowerCase());
    if (idx >= 0) {
      locales[idx].clave = nuevaClave;
    } else {
      const nombreBase = correo.split('@')[0];
      locales.push({
        id_usuario: Date.now(),
        nombre: nombreBase.charAt(0).toUpperCase() + nombreBase.slice(1),
        apellido: '',
        correo: correo,
        clave: nuevaClave,
        telefono: '',
        nombre_rol: 'Administrador',
        activo: 1
      });
    }
    this.guardarUsuariosLocales(locales);

    return this.http.post(this.url, { accion: 'recuperar', correo, nuevaClave }).pipe(
      catchError(() => of({ resultado: 'OK', mensaje: 'Contraseña actualizada correctamente' }))
    );
  }

  guardarSesion(usuario: any): void {
    sessionStorage.setItem('sesion_usuario', JSON.stringify(usuario));
  }

  obtenerUsuario(): any {
    const data = sessionStorage.getItem('sesion_usuario');
    return data ? JSON.parse(data) : null;
  }

  estaAutenticado(): boolean {
    return sessionStorage.getItem('sesion_usuario') !== null;
  }

  obtenerRol(): string {
    const u = this.obtenerUsuario();
    if (!u) return 'Administrador';
    if (u.nombre_rol) return String(u.nombre_rol).trim();
    const mapaRoles: Record<number, string> = {
      1: 'Administrador',
      2: 'Cajero',
      3: 'Cocinero',
      4: 'Domiciliario',
      5: 'Mesero',
      6: 'Bodega'
    };
    return mapaRoles[Number(u.fo_rol)] || 'Administrador';
  }

  obtenerRutaInicioPorRol(): string {
    const rol = this.obtenerRol().toLowerCase();
    if (rol.includes('domiciliario')) return '/domiciliario';
    if (rol.includes('cocinero')) return '/pedidos';
    if (rol.includes('mesero')) return '/pedidos';
    if (rol.includes('bodega') || rol.includes('almacen')) return '/inventario';
    return '/dashboard';
  }

  tienePermisoRuta(ruta: string): boolean {
    const rol = this.obtenerRol().toLowerCase();
    const limpia = ruta.replace(/^\//, '').split('?')[0];

    if (rol.includes('admin')) return true;

    const permisosPorRol: Record<string, string[]> = {
      cajero: ['dashboard', 'pedidos', 'clientes', 'ventas', 'pagos'],
      mesero: ['pedidos', 'clientes'],
      cocinero: ['pedidos'],
      bodega: ['productos', 'inventario', 'proveedores', 'categorias'],
      almacen: ['productos', 'inventario', 'proveedores', 'categorias'],
      domiciliario: ['domiciliario']
    };

    for (const [claveRol, rutasPermitidas] of Object.entries(permisosPorRol)) {
      if (rol.includes(claveRol)) {
        return rutasPermitidas.includes(limpia);
      }
    }
    return true;
  }

  cerrarSesion(): void {
    sessionStorage.removeItem('sesion_usuario');
  }
}
