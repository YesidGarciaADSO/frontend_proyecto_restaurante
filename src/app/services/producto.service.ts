import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private http = inject(HttpClient);
  private url = 'http://localhost/proyectos/restaurante/backend/controladores/producto.php';

  consulta(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}?control=consulta`);
  }

  insertar(params: any): Observable<any> {
    return this.http.post(`${this.url}?control=insertar`, params);
  }

  editar(id: number, params: any): Observable<any> {
    return this.http.post(`${this.url}?control=editar&id=${id}`, params);
  }

  eliminar(id: number): Observable<any> {
    return this.http.get(`${this.url}?control=eliminar&id=${id}`);
  }

  obtenerVentas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}?control=consultaVentas`);
  }
}
