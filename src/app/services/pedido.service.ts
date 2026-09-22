import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private http = inject(HttpClient);
  private url = 'http://localhost/proyectos/restaurante/backend/controladores/pedido.php';

  consulta(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}?control=consulta`);
  }

  insertar(params: any): Observable<any> {
    return this.http.post(`${this.url}?control=insertar`, params);
  }

  cambiarEstado(id: number, params: any): Observable<any> {
    return this.http.post(`${this.url}?control=cambiarEstado&id=${id}`, params);
  }

  eliminar(id: number): Observable<any> {
    return this.http.get(`${this.url}?control=eliminar&id=${id}`);
  }

  asignarRepartidor(idPedido: number, idDomiciliario: number): Observable<any> {
    return this.http.post(`${this.url}?control=asignarRepartidor&id=${idPedido}`, { id_domiciliario: idDomiciliario });
  }

  consultarRepartidores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}?control=consultarRepartidores`);
  }

  consultaPorDomiciliario(idDomiciliario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}?control=consultaPorDomiciliario&id_domiciliario=${idDomiciliario}`);
  }
}
