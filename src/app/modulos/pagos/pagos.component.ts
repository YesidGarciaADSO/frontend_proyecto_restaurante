import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagoService } from '../../services/pago.service';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagos.component.html'
})
export class PagosComponent implements OnInit {
  // Servicios
  private pagoService = inject(PagoService);
  private cdr = inject(ChangeDetectorRef);

  // Lista pagos
  public listaPagos: any[] = [];
  // Cargando
  public cargando: boolean = true;

  // Filtros
  public busqueda: string = '';
  public filtroMetodo: string = 'todos';
  public filtroEstado: string = 'todos';

  // Paginacion
  public paginaActual: number = 1;
  public itemsPorPagina: number = 10;

  // Carga inicial
  ngOnInit(): void {
    this.cargarPagos();
  }

  // Cargar pagos
  cargarPagos(): void {
    this.cargando = true;
    this.pagoService.consulta().subscribe({
      next: (data: any[]) => {
        this.listaPagos = Array.isArray(data) ? data : [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar pagos:', err);
        this.listaPagos = [];
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Filtrar pagos
  get pagosFiltrados(): any[] {
    let lista = this.listaPagos;

    if (this.filtroMetodo !== 'todos') {
      lista = lista.filter(p => (p.metodo || '').toLowerCase() === this.filtroMetodo.toLowerCase());
    }

    if (this.filtroEstado !== 'todos') {
      lista = lista.filter(p => (p.estado || '').toLowerCase() === this.filtroEstado);
    }

    const term = this.busqueda.toLowerCase().trim();
    if (!term) return lista;
    return lista.filter(p =>
      (p.metodo || '').toLowerCase().includes(term) ||
      (p.estado || '').toLowerCase().includes(term) ||
      String(p.id_pago).includes(term) ||
      String(p.fo_pedido).includes(term) ||
      String(p.monto).includes(term)
    );
  }

  // Pagina actual
  get pagosPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.pagosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  // Total paginas
  get totalPaginas(): number {
    return Math.ceil(this.pagosFiltrados.length / this.itemsPorPagina);
  }

  // Array paginas
  get paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  // Cambiar pagina
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  // Reset pagina
  onFiltroCambio(): void {
    this.paginaActual = 1;
  }

  // Cambiar estado
  cambiarEstado(idPago: number, nuevoEstado: string): void {
    this.pagoService.editarEstado(idPago, { estado: nuevoEstado }).subscribe({
      next: () => this.cargarPagos(),
      error: (err) => console.error('Error al cambiar estado:', err)
    });
  }

  // Anular pago
  anularPago(idPago: number): void {
    if (!confirm('¿Estás seguro de anular este pago? Se marcará como rechazado.')) {
      return;
    }
    this.pagoService.eliminar(idPago).subscribe({
      next: () => this.cargarPagos(),
      error: (err) => console.error('Error al anular:', err)
    });
  }

  // Badge estado
  getBadgeEstado(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'aprobado': return 'bg-success-subtle text-success border border-success-subtle';
      case 'pendiente': return 'bg-warning-subtle text-warning border border-warning-subtle';
      case 'rechazado': return 'bg-danger-subtle text-danger border border-danger-subtle';
      default: return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
    }
  }

  // Icono metodo
  getIconoMetodo(metodo: string): string {
    switch (metodo?.toLowerCase()) {
      case 'efectivo': return 'bi-cash-stack';
      case 'nequi': return 'bi-phone';
      case 'tarjeta': return 'bi-credit-card';
      case 'daviplata': return 'bi-phone';
      default: return 'bi-question-circle';
    }
  }
}
