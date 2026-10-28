import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DepartamentoService {
  private http = inject(HttpClient);
  // private url = 'http://localhost/proyectos/restaurante/backend/controladores/departamento.php';
  private url = 'https://fastfood-os.site.je/backend/controladores/departamento.php';

  consulta(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}?control=consulta`);
  }
}
