import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../services/inventario.service';

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
  private cdr = inject(ChangeDetectorRef);

  // Lista inventario
  public listaInventario: any[] = [];
  // Cargando
  public cargando: boolean = true;
  // Busqueda
  public busqueda: string = '';
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

  // Filtrar inventario
  get inventarioFiltrado(): any[] {
    const term = this.busqueda.toLowerCase().trim();
    if (!term) return this.listaInventario;
    return this.listaInventario.filter(p =>
      (p.nombre || '').toLowerCase().includes(term) ||
      (p.nombre_categoria || '').toLowerCase().includes(term)
    );
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
}
