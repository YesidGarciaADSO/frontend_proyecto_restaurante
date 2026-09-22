import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private http = inject(HttpClient);
  url = 'http://localhost/proyectos/restaurante/backend/controladores/login.php';

  login(correo: string, clave: string): Observable<any> {
    return this.http.post(this.url, { correo, clave });
  }

  register(datos: any): Observable<any> {
    return this.http.post(this.url, datos);
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

  cerrarSesion(): void {
    sessionStorage.removeItem('sesion_usuario');
  }
}
