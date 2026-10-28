import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private http = inject(HttpClient);
  // private url = 'http://localhost/proyectos/restaurante/backend/controladores/inventario.php';
  private url = 'https://fastfood-os.site.je/backend/controladores/inventario.php';

  consulta(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}?control=consulta`);
  }

  editar(id: number, params: any): Observable<any> {
    return this.http.post(`${this.url}?control=editar&id=${id}`, params);
  }
}
