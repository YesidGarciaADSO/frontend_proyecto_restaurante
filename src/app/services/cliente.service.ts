import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);
  //private url = 'http://localhost/proyectos/restaurante/backend/controladores/cliente.php';
  private url = 'https://fastfood-os.site.je/backend/controladores/cliente.php';

  consulta(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}?control=consulta`);
  }

  insertar(cliente: any): Observable<any> {
    return this.http.post(`${this.url}?control=insertar`, cliente);
  }

  editar(id: number, cliente: any): Observable<any> {
    return this.http.post(`${this.url}?control=editar&id=${id}`, cliente);
  }

  eliminar(id: number): Observable<any> {
    return this.http.get(`${this.url}?control=eliminar&id=${id}`);
  }
}
