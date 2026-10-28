import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private http = inject(HttpClient);
  //private url = 'http://localhost/proyectos/restaurante/backend/controladores/categoria.php';
  private url = 'https://fastfood-os.site.je/backend/controladores/categoria.php';
  
  

  consulta(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}?control=consulta`);
  }

  insertar(categoria: any): Observable<any> {
    return this.http.post(`${this.url}?control=insertar`, categoria);
  }

  editar(id: number, categoria: any): Observable<any> {
    return this.http.post(`${this.url}?control=editar&id=${id}`, categoria);
  }

  eliminar(id: number): Observable<any> {
    return this.http.get(`${this.url}?control=eliminar&id=${id}`);
  }
}
