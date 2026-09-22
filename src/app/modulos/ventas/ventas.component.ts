import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.component.html',
})
export class VentasComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private productoService = inject(ProductoService);

  public listaVentas: any[] = [];
  public cargando: boolean = true;
  public busqueda: string = '';
  public paginaActual: number = 1;
  public itemsPorPagina: number = 8;

  ngOnInit() {
    this.cargarHistorialVentas();
  }

  cargarHistorialVentas() {
    this.cargando = true;
    this.productoService.obtenerVentas().subscribe({
      next: (datos: any[]) => {
        this.listaVentas = Array.isArray(datos) ? datos : [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al cargar el historial de ventas:', error);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  get ventasFiltradas(): any[] {
    const term = this.busqueda.toLowerCase().trim();
    if (!term) return this.listaVentas;
    return this.listaVentas.filter(v =>
      (v.cliente || '').toLowerCase().includes(term) ||
      (v.id_pedido || '').toString().includes(term) ||
      (v.fecha || '').toLowerCase().includes(term) ||
      (v.metodo_pago || '').toLowerCase().includes(term)
    );
  }

  get ventasPaginadas(): any[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.ventasFiltradas.slice(inicio, inicio + this.itemsPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.ventasFiltradas.length / this.itemsPorPagina);
  }

  get paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  onBusqueda(): void {
    this.paginaActual = 1;
  }
}
