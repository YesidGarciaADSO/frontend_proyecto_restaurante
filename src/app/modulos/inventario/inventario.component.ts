import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../services/inventario.service';
import { ReporteService } from '../../services/reporte.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {
  // Servicios
  private inventarioService = inject(InventarioService);
  private reporteService = inject(ReporteService);
  private cdr = inject(ChangeDetectorRef);

  // Lista inventario
  public listaInventario: any[] = [];
  // Cargando
  public cargando: boolean = true;
  // Busqueda y filtro de nivel
  public busqueda: string = '';
  public filtroNivel: string = 'todos';
  // Paginacion
  public paginaActual: number = 1;
  public itemsPorPagina: number = 10;
  // Editando id
  public editandoId: number | null = null;
  // Stock editado
  public stockEditado: number = 0;

  // Carga inicial
  ngOnInit(): void {
    this.cargarInventario();
  }

  // Cargar inventario
  cargarInventario(): void {
    this.cargando = true;
    this.inventarioService.consulta().subscribe({
      next: (datos) => {
        this.listaInventario = Array.isArray(datos) ? datos : [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar inventario:', err);
        this.listaInventario = [];
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  get totalUnidadesBodega(): number {
    return this.listaInventario.reduce((acc, item) => acc + (parseInt(item.stock, 10) || 0), 0);
  }

  get totalStockCritico(): number {
    return this.listaInventario.filter(item => {
      const s = parseInt(item.stock, 10) || 0;
      return s > 0 && s <= 5;
    }).length;
  }

  get totalAgotados(): number {
    return this.listaInventario.filter(item => (parseInt(item.stock, 10) || 0) <= 0).length;
  }

  // Filtrar inventario
  get inventarioFiltrado(): any[] {
    let lista = this.listaInventario;

    if (this.filtroNivel === 'critico') {
      lista = lista.filter(p => {
        const s = parseInt(p.stock, 10) || 0;
        return s > 0 && s <= 5;
      });
    } else if (this.filtroNivel === 'agotado') {
      lista = lista.filter(p => (parseInt(p.stock, 10) || 0) <= 0);
    } else if (this.filtroNivel === 'optimo') {
      lista = lista.filter(p => (parseInt(p.stock, 10) || 0) > 5);
    }

    const term = this.busqueda.toLowerCase().trim();
    if (!term) return lista;
    return lista.filter(p =>
      (p.nombre || '').toLowerCase().includes(term) ||
      (p.nombre_categoria || '').toLowerCase().includes(term)
    );
  }

  cambiarFiltroNivel(nivel: string): void {
    this.filtroNivel = nivel;
    this.paginaActual = 1;
  }

  ajustarStockRapido(item: any, delta: number): void {
    const actual = parseInt(item.stock, 10) || 0;
    const nuevo = Math.max(0, actual + delta);
    item.stock = nuevo;
    this.inventarioService.editar(item.id_producto, { stock: nuevo }).subscribe({
      next: () => this.cdr.detectChanges(),
      error: (err) => console.error('Error en ajuste rápido:', err)
    });
  }

  // Pagina actual
  get inventarioPaginado(): any[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.inventarioFiltrado.slice(inicio, inicio + this.itemsPorPagina);
  }

  // Total paginas
  get totalPaginas(): number {
    return Math.ceil(this.inventarioFiltrado.length / this.itemsPorPagina);
  }

  // Array paginas
  get paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  // Cambia la pagina actual
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  // Resetea la pagina a 1 cuando se busca algo
  onBusqueda(): void {
    this.paginaActual = 1;
  }

  // Iniciar edicion
  iniciarEdicion(producto: any): void {
    this.editandoId = producto.id_producto;
    this.stockEditado = producto.stock || 0;
  }

  // Cancelar edicion
  cancelarEdicion(): void {
    this.editandoId = null;
    this.stockEditado = 0;
  }

  // Guardar stock
  guardarStock(idProducto: number): void {
    this.inventarioService.editar(idProducto, { stock: this.stockEditado }).subscribe({
      next: () => {
        this.editandoId = null;
        this.cargarInventario();
      },
      error: (err) => {
        console.error('Error al actualizar stock:', err);
      }
    });
  }

  // Badge stock
  getBadgeStock(stock: number): string {
    if (stock > 10) return 'bg-success-subtle text-success border border-success-subtle';
    if (stock > 0) return 'bg-warning-subtle text-warning border border-warning-subtle';
    return 'bg-danger-subtle text-danger border border-danger-subtle';
  }

  descargarExcel(): void {
    const encabezados = ['ID Producto', 'Producto', 'Categoria', 'Stock Actual (Unidades)', 'Estado Stock'];
    const filas = this.inventarioFiltrado.map(item => [
      `#PRD-${item.id_producto}`,
      item.nombre || '',
      item.nombre_categoria || 'General',
      item.stock || 0,
      item.stock > 10 ? 'Optimo' : item.stock > 0 ? 'Stock Bajo' : 'Agotado'
    ]);
    this.reporteService.exportarExcelCSV('Reporte_Inventario', encabezados, filas);
  }

  descargarPDF(): void {
    const encabezados = ['SKU', 'Producto', 'Categoría', 'Stock Actual', 'Estado'];
    const totalUnidades = this.inventarioFiltrado.reduce((acc, item) => acc + parseInt(item.stock || 0, 10), 0);
    const filas = this.inventarioFiltrado.map(item => [
      `#PRD-${item.id_producto}`,
      item.nombre || '',
      item.nombre_categoria || 'General',
      `${item.stock || 0} unidades`,
      item.stock > 10 ? 'Óptimo' : item.stock > 0 ? 'Stock Bajo' : 'Agotado'
    ]);
    this.reporteService.exportarPDF(
      'Reporte de Control de Inventario',
      'Existencias y niveles de stock de productos en bodega',
      encabezados,
      filas,
      `Total de productos inventariados: ${this.inventarioFiltrado.length} | Total existencias acumuladas: ${totalUnidades} unidades`
    );
  }
}
