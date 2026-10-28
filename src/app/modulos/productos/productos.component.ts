import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';
import { ProveedorService } from '../../services/proveedor.service';
import { ReporteService } from '../../services/reporte.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './productos.component.html',
})
export class ProductosComponent implements OnInit {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private proveedorService = inject(ProveedorService);
  private reporteService = inject(ReporteService);
  private cdr = inject(ChangeDetectorRef);

  public listaProductos: any[] = [];
  public listaCategorias: any[] = [];
  public listaProveedores: any[] = [];
  public busqueda: string = '';
  public paginaActual: number = 1;
  public itemsPorPagina: number = 8;

  public modalAbierto: boolean = false;

  public nuevoProducto: any = {
    nombre: '',
    descripcion: '',
    precio: 0,
    fo_categoria: '',
    stock: 0,
    activo: 1,
    proveedor: ''
  };

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

    this.proveedorService.consulta().subscribe({
      next: (provs: any[]) => {
        this.listaProveedores = Array.isArray(provs) ? provs : [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error al cargar proveedores:', err),
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
      (p.descripcion || '').toLowerCase().includes(term) ||
      (p.proveedor || '').toLowerCase().includes(term)
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
    this.nuevoProducto = {
      nombre: '',
      descripcion: '',
      precio: 0,
      fo_categoria: '',
      stock: 0,
      activo: 1,
      proveedor: ''
    };
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardarProducto(): void {
    let catId = parseInt(this.nuevoProducto.fo_categoria);
    if (isNaN(catId)) {
      const catEncontrada = this.listaCategorias.find(
        c => c.nombre === this.nuevoProducto.nombre_categoria
      );
      catId = catEncontrada ? parseInt(catEncontrada.id_categoria) : 1;
    }

    const prod = this.nuevoProducto;
    const datosAEnviar = {
      id_producto: prod['id_producto'] || null,
      nombre: prod.nombre,
      descripcion: prod.descripcion || '',
      precio: parseFloat(prod.precio?.toString()) || 0,
      fo_categoria: catId,
      stock: parseInt(prod.stock?.toString()) || 0,
      activo: prod.activo !== undefined ? Number(prod.activo) : 1,
      proveedor: prod.proveedor || ''
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
    let catId = prod.fo_categoria;
    if (!catId && prod.nombre_categoria) {
      const cat = this.listaCategorias.find(c => c.nombre === prod.nombre_categoria);
      if (cat) catId = cat.id_categoria;
    }
    this.nuevoProducto = { ...prod, fo_categoria: catId || 1, proveedor: prod.proveedor || '' };
    this.modalAbierto = true;
  }

  cambiarEstadoProducto(prod: any, activo: boolean) {
    const nuevoEstado = activo ? 1 : 0;
    let catId = parseInt(prod.fo_categoria);
    if (isNaN(catId)) {
      const cat = this.listaCategorias.find(c => c.nombre === prod.nombre_categoria);
      catId = cat ? parseInt(cat.id_categoria) : 1;
    }

    // Enviamos el objeto completo del producto para que el servidor remoto no pierda ningun campo
    const payload = {
      nombre: prod.nombre,
      descripcion: prod.descripcion || '',
      precio: parseFloat(prod.precio) || 0,
      stock: parseInt(prod.stock) || 0,
      fo_categoria: catId,
      activo: nuevoEstado,
      proveedor: prod.proveedor || ''
    };

    this.productoService.editar(prod.id_producto, payload).subscribe({
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

  descargarExcel(): void {
    const encabezados = ['SKU', 'Producto', 'Descripcion', 'Categoria', 'Precio Venta', 'Stock', 'Estado', 'Proveedor'];
    const filas = this.productosFiltrados.map(p => [
      `#PRD-${p.id_producto}`,
      p.nombre || '',
      p.descripcion || 'Sin descripción',
      p.nombre_categoria || 'General',
      p.precio || 0,
      p.stock || 0,
      p.stock > 5 ? 'Disponible' : p.stock > 0 ? 'Stock bajo' : 'Agotado',
      p.proveedor || 'Distribuidor Local'
    ]);
    this.reporteService.exportarExcelCSV('Reporte_Productos', encabezados, filas);
  }

  descargarPDF(): void {
    const encabezados = ['SKU', 'Producto', 'Categoría', 'Precio', 'Stock', 'Estado', 'Proveedor'];
    const totalUnidades = this.productosFiltrados.reduce((acc, p) => acc + parseInt(p.stock || 0, 10), 0);
    const filas = this.productosFiltrados.map(p => [
      `#PRD-${p.id_producto}`,
      p.nombre || '',
      p.nombre_categoria || 'General',
      `$${Number(p.precio || 0).toLocaleString('es-CO')}`,
      `${p.stock || 0} und.`,
      p.stock > 5 ? 'Disponible' : p.stock > 0 ? 'Stock bajo' : 'Agotado',
      p.proveedor || 'Distribuidor Local'
    ]);
    this.reporteService.exportarPDF(
      'Catálogo e Inventario de Productos',
      'Listado general de productos, precios y existencias en bodega',
      encabezados,
      filas,
      `Total de referencias: ${this.productosFiltrados.length} | Total unidades en inventario: ${totalUnidades} und.`
    );
  }
}
