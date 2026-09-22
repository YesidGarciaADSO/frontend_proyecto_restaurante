import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private http = inject(HttpClient);
  private url = 'http://localhost/proyectos/restaurante/backend/controladores/proveedor.php';

  consulta(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}?control=consulta`);
  }

  insertar(proveedor: any): Observable<any> {
    return this.http.post(`${this.url}?control=insertar`, proveedor);
  }

  editar(id: number, proveedor: any): Observable<any> {
    return this.http.post(`${this.url}?control=editar&id=${id}`, proveedor);
  }

  eliminar(id: number): Observable<any> {
    return this.http.get(`${this.url}?control=eliminar&id=${id}`);
  }
}
