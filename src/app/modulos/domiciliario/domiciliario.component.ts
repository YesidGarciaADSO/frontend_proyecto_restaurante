import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-domiciliario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './domiciliario.component.html'
})
export class DomiciliarioComponent implements OnInit {
  // Servicios
  private pedidoService = inject(PedidoService);
  private cdr = inject(ChangeDetectorRef);

  // Lista pedidos
  public listaPedidos: any[] = [];
  // Pedido seleccionado
  public pedidoSeleccionado: any = null;
  // Cargando
  public cargando: boolean = true;
  // Filtro activo
  public filtroActivo: string = 'todos';
  // Busqueda
  public busqueda: string = '';
  // Paginacion
  public paginaActual: number = 1;
  public itemsPorPagina: number = 8;

  // Carga inicial
  ngOnInit(): void {
    this.cargarPedidos();
  }

  // Cargar pedidos
  cargarPedidos(): void {
    this.cargando = true;
    this.pedidoService.consulta().subscribe({
      next: (res: any[]) => {
        const domicilios = Array.isArray(res) ? res.filter(p => p.tipo === 'domicilio') : [];
        this.listaPedidos = domicilios;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando pedidos:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Filtrar pedidos
  get pedidosFiltrados(): any[] {
    let lista = this.listaPedidos;
    // Por estado
    if (this.filtroActivo !== 'todos') {
      lista = lista.filter(p => p.estado?.toLowerCase() === this.filtroActivo);
    }
    // Por texto
    const term = this.busqueda.toLowerCase().trim();
    if (term) {
      lista = lista.filter(p =>
        (p.nombre_cliente || '').toLowerCase().includes(term) ||
        (p.direccion_entrega || '').toLowerCase().includes(term) ||
        String(p.id_pedido).includes(term)
      );
    }
    return lista;
  }

  // Pagina actual
  get pedidosPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.pedidosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  // Total paginas
  get totalPaginas(): number {
    return Math.ceil(this.pedidosFiltrados.length / this.itemsPorPagina);
  }

  // Array paginas
  get paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  // Total en camino
  get totalEnCamino(): number {
    return this.listaPedidos.filter(p => p.estado === 'en_camino').length;
  }

  // Total entregados
  get totalEntregados(): number {
    return this.listaPedidos.filter(p => p.estado === 'entregado').length;
  }

  // Total pendientes
  get totalPendientes(): number {
    return this.listaPedidos.filter(p => p.estado === 'pendiente' || p.estado === 'en_preparacion').length;
  }

  // Cambiar pagina
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  // Reset pagina
  onBusqueda(): void {
    this.paginaActual = 1;
  }

  // Cambiar filtro
  cambiarFiltro(nuevoFiltro: string): void {
    this.filtroActivo = nuevoFiltro;
    this.paginaActual = 1;
  }

  // Iniciar ruta
  iniciarRuta(idPedido: number): void {
    const payload = { estado: 'en_camino' };
    this.pedidoService.cambiarEstado(idPedido, payload).subscribe({
      next: () => {
        this.cargarPedidos();
        if (this.pedidoSeleccionado && this.pedidoSeleccionado.id_pedido === idPedido) {
          this.pedidoSeleccionado.estado = 'en_camino';
        }
      },
      error: (err) => console.error('Error al iniciar ruta:', err)
    });
  }

  // Confirmar entrega
  confirmarEntrega(idPedido: number): void {
    if (confirm('¿Confirmas que el pedido ha sido entregado al cliente y el pago fue recibido?')) {
      const payload = { estado: 'entregado' };
      this.pedidoService.cambiarEstado(idPedido, payload).subscribe({
        next: () => {
          this.cargarPedidos();
          this.cerrarModal();
        },
        error: (err) => console.error('Error al confirmar entrega:', err)
      });
    }
  }

  // Ver detalles
  verDetalles(pedido: any): void {
    this.pedidoSeleccionado = pedido;
  }

  // Cerrar modal
  cerrarModal(): void {
    this.pedidoSeleccionado = null;
  }
}
