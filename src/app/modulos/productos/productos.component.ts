import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './productos.component.html',
})
export class ProductosComponent implements OnInit {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private cdr = inject(ChangeDetectorRef);

  public listaProductos: any[] = [];
  public listaCategorias: any[] = [];
  public busqueda: string = '';
  public paginaActual: number = 1;
  public itemsPorPagina: number = 8;

  public modalAbierto: boolean = false;

  public nuevoProducto: any = { nombre: '', descripcion: '', precio: 0, fo_categoria: '', stock: 0, activo: 1 };

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.categoriaService.consulta().subscribe({
      next: (cats: any[]) => {
        this.listaCategorias = Array.isArray(cats) ? cats : [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error al cargar categorias:', err),
    });

    this.productoService.consulta().subscribe({
      next: (prods) => {
        this.listaProductos = Array.isArray(prods) ? [...prods] : [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error al cargar productos:', err),
    });
  }

  get productosFiltrados(): any[] {
    const term = this.busqueda.toLowerCase().trim();
    if (!term) return this.listaProductos;
    return this.listaProductos.filter(p =>
      (p.nombre || '').toLowerCase().includes(term) ||
      (p.nombre_categoria || '').toLowerCase().includes(term) ||
      (p.descripcion || '').toLowerCase().includes(term)
    );
  }

  get productosPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.productosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.productosFiltrados.length / this.itemsPorPagina);
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

  abrirModal(): void {
    this.nuevoProducto = { nombre: '', descripcion: '', precio: 0, fo_categoria: '', stock: 0, activo: 1 };
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardarProducto(): void {
    let catId = parseInt(this.nuevoProducto.fo_categoria);
    if (isNaN(catId)) { catId = 1; }

    const prod = this.nuevoProducto;
    const datosAEnviar = {
      id_producto: prod['id_producto'] || null,
      nombre: prod.nombre,
      descripcion: prod.descripcion || '',
      precio: parseFloat(prod.precio?.toString()) || 0,
      fo_categoria: catId,
      stock: parseInt(prod.stock?.toString()) || 0,
      activo: 1,
    };

    if (datosAEnviar.id_producto) {
      this.productoService.editar(datosAEnviar.id_producto, datosAEnviar).subscribe({
        next: () => this.finalizarGuardado(),
        error: (err: any) => console.error('Error al editar:', err),
      });
    } else {
      this.productoService.insertar(datosAEnviar).subscribe({
        next: () => this.finalizarGuardado(),
        error: (err: any) => console.error('Error al insertar:', err),
      });
    }
  }

  finalizarGuardado(): void {
    this.cargarDatos();
    this.cerrarModal();
  }

  editarProducto(prod: any) {
    this.nuevoProducto = { ...prod };
    this.modalAbierto = true;
  }

  cambiarEstadoProducto(id: number, activo: boolean) {
    const nuevoEstado = activo ? 1 : 0;
    this.productoService.editar(id, { activo: nuevoEstado }).subscribe({
      next: () => this.cargarDatos(),
      error: (err: any) => console.error('Error al cambiar estado:', err)
    });
  }

  eliminarProducto(id: number, nombre: string) {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    this.productoService.eliminar(id).subscribe({
      next: () => this.cargarDatos(),
      error: (err: any) => console.error('Error al eliminar:', err)
    });
  }
}
