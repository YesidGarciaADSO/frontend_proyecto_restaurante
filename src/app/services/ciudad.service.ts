import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CiudadService {
  private http = inject(HttpClient);
  private url = 'http://localhost/proyectos/restaurante/backend/controladores/ciudad.php';

  consulta(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}?control=consulta`);
  }

  filtrarPorDepartamento(idDepartamento: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}?control=consulta&fo_departamento=${idDepartamento}`);
  }
}
