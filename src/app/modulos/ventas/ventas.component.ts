import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { ReporteService } from '../../services/reporte.service';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.component.html',
})
export class VentasComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private productoService = inject(ProductoService);
  private reporteService = inject(ReporteService);

  public listaVentas: any[] = [];
  public cargando: boolean = true;
  public busqueda: string = '';
  public filtroEstadoVenta: string = 'efectivas';
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
    let lista = this.listaVentas;

    if (this.filtroEstadoVenta === 'efectivas') {
      lista = lista.filter(v => (v.estado || '').toLowerCase() !== 'cancelado');
    } else if (this.filtroEstadoVenta === 'entregado') {
      lista = lista.filter(v => (v.estado || '').toLowerCase() === 'entregado');
    } else if (this.filtroEstadoVenta === 'cancelado') {
      lista = lista.filter(v => (v.estado || '').toLowerCase() === 'cancelado');
    }

    const term = this.busqueda.toLowerCase().trim();
    if (!term) return lista;
    return lista.filter(v =>
      (v.cliente || '').toLowerCase().includes(term) ||
      (v.resumen_productos || '').toLowerCase().includes(term) ||
      (v.id_pedido || v.id || '').toString().includes(term) ||
      (v.fecha || '').toLowerCase().includes(term) ||
      (v.metodo_pago || '').toLowerCase().includes(term)
    );
  }

  get totalRecaudadoVista(): number {
    return this.ventasFiltradas
      .filter(v => (v.estado || '').toLowerCase() !== 'cancelado')
      .reduce((acc, v) => acc + parseFloat(v.total || 0), 0);
  }

  get totalFacturasEfectivas(): number {
    return this.ventasFiltradas.filter(v => (v.estado || '').toLowerCase() !== 'cancelado').length;
  }

  get ticketPromedioVista(): number {
    const efectivas = this.totalFacturasEfectivas;
    return efectivas > 0 ? Math.round(this.totalRecaudadoVista / efectivas) : 0;
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

  obtenerTextoProductos(venta: any): string {
    if (venta.resumen_productos && String(venta.resumen_productos).trim() !== '') {
      return venta.resumen_productos;
    }
    if (Array.isArray(venta.productos) && venta.productos.length > 0) {
      return venta.productos.map((p: any) => `${p.cantidad}x ${p.nombre}`).join(', ');
    }
    return '1x Consumo General';
  }

  imprimirFactura(venta: any): void {
    this.reporteService.imprimirTicketPOS({
      idPedido: venta.id_pedido || venta.id,
      cliente: venta.cliente || `Cliente #${venta.fo_cliente || 'N/A'}`,
      fecha: venta.fecha,
      tipo: venta.tipo || 'Local',
      metodoPago: venta.metodo_pago || 'Efectivo',
      estado: venta.estado,
      total: Number(venta.total || 0),
      productos: Array.isArray(venta.productos) ? venta.productos : []
    });
  }

  descargarExcel(): void {
    const encabezados = ['Factura', 'Fecha', 'Cliente', 'Productos Vendidos', 'Tipo de Entrega', 'Metodo de Pago', 'Estado', 'Total Cobrado'];
    const filas = this.ventasFiltradas.map(v => [
      `#FAC-${v.id_pedido || v.id}`,
      v.fecha || '',
      v.cliente || `Cliente #${v.fo_cliente || 'N/A'}`,
      this.obtenerTextoProductos(v),
      v.tipo || 'Local',
      v.metodo_pago || 'Efectivo',
      (v.estado || 'entregado').toUpperCase(),
      v.total || 0
    ]);
    this.reporteService.exportarExcelCSV('Reporte_Ventas', encabezados, filas);
  }

  descargarPDF(): void {
    const encabezados = ['Factura', 'Fecha', 'Cliente', 'Productos Vendidos', 'Tipo', 'Pago', 'Total Cobrado'];
    const totalAcumulado = this.totalRecaudadoVista;
    const filas = this.ventasFiltradas.map(v => [
      `#FAC-${v.id_pedido || v.id}`,
      v.fecha || '',
      v.cliente || `Cliente #${v.fo_cliente || 'N/A'}`,
      this.obtenerTextoProductos(v),
      (v.tipo || 'Local').toUpperCase(),
      v.metodo_pago || 'Efectivo',
      `$${Number(v.total || 0).toLocaleString('es-CO')}`
    ]);
    this.reporteService.exportarPDF(
      'Reporte de Historial de Ventas',
      'Consolidado de ingresos, productos vendidos y transacciones registradas',
      encabezados,
      filas,
      `Total General de Ingresos Efectivos en el Reporte: $${totalAcumulado.toLocaleString('es-CO')}`
    );
  }
}
