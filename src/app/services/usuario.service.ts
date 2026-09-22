import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private url = 'http://localhost/proyectos/restaurante/backend/controladores/usuario.php';

  consulta(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}?control=consulta`);
  }

  roles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}?control=roles`);
  }

  insertar(usuario: any): Observable<any> {
    return this.http.post(`${this.url}?control=insertar`, usuario);
  }

  editar(id: number, usuario: any): Observable<any> {
    return this.http.post(`${this.url}?control=editar&id=${id}`, usuario);
  }

  cambiarEstado(id: number, activo: number): Observable<any> {
    return this.http.post(`${this.url}?control=cambiarEstado&id=${id}`, { activo });
  }
}
