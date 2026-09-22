import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PagoService {
  private http = inject(HttpClient);
  private url = 'http://localhost/proyectos/restaurante/backend/controladores/pago.php';

  consulta(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}?control=consulta`);
  }

  insertar(params: any): Observable<any> {
    return this.http.post(`${this.url}?control=insertar`, params);
  }

  editarEstado(id: number, params: any): Observable<any> {
    return this.http.post(`${this.url}?control=editarEstado&id=${id}`, params);
  }

  eliminar(id: number): Observable<any> {
    return this.http.get(`${this.url}?control=eliminar&id=${id}`);
  }
}
