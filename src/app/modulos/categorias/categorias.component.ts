import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../services/categoria.service';

@Component({
  selector: 'app-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.component.html'
})
export class CategoriaComponent implements OnInit {
  // Servicios
  private categoriaService = inject(CategoriaService);
  private cdr = inject(ChangeDetectorRef);

  // Lista categorias
  public listaCategorias: any[] = [];
  // Input nueva categoria
  public nuevaCategoria: string = '';
  // Categoria en edicion
  public categoriaEditando: any = null;
  // Nombre editado
  public nombreEditado: string = '';
  // Alerta
  public mensajeAlerta: string = '';
  // Busqueda
  public busqueda: string = '';
  // Paginacion
  public paginaActual: number = 1;
  public itemsPorPagina: number = 8;

  // Carga al iniciar
  ngOnInit(): void {
    this.cargarCategorias();
  }

  // Cargar categorias
  cargarCategorias(): void {
    this.categoriaService.consulta().subscribe({
      next: (data: any[]) => {
        this.listaCategorias = Array.isArray(data) ? data : [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error al cargar categorias', err)
    });
  }

  // Filtrar por busqueda
  get categoriasFiltradas(): any[] {
    const term = this.busqueda.toLowerCase().trim();
    if (!term) return this.listaCategorias;
    return this.listaCategorias.filter(c =>
      (c.nombre || '').toLowerCase().includes(term) ||
      (c.id_categoria || '').toString().includes(term)
    );
  }

  // Pagina actual
  get categoriasPaginadas(): any[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.categoriasFiltradas.slice(inicio, inicio + this.itemsPorPagina);
  }

  // Total paginas
  get totalPaginas(): number {
    return Math.ceil(this.categoriasFiltradas.length / this.itemsPorPagina);
  }

  // Array de paginas
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
  onBusqueda(): void {
    this.paginaActual = 1;
  }

  // Guardar categoria
  guardarCategoria(): void {
    if (!this.nuevaCategoria.trim()) return;
    const objetoEnvio = { nombre: this.nuevaCategoria };
    this.categoriaService.insertar(objetoEnvio).subscribe({
      next: (res: any) => {
        if (res.resultado === 'OK') {
          this.mensajeAlerta = '¡Categoría añadida con éxito!';
          this.nuevaCategoria = '';
          this.cargarCategorias();
          this.cdr.detectChanges();
          setTimeout(() => this.mensajeAlerta = '', 3000);
        }
      },
      error: (err: any) => console.error('Error al insertar', err)
    });
  }

  // Eliminar categoria
  borrarCategoria(id: number): void {
    if (confirm('¿Seguro que deseas eliminar esta categoría?')) {
      this.categoriaService.eliminar(id).subscribe({
        next: (res: any) => {
          if (res.resultado === 'OK') {
            this.mensajeAlerta = 'Categoría eliminada correctamente.';
            this.cargarCategorias();
            setTimeout(() => this.mensajeAlerta = '', 3000);
          }
        },
        error: (err: any) => console.error('Error al eliminar', err)
      });
    }
  }

  // Iniciar edicion
  iniciarEdicion(cat: any): void {
    this.categoriaEditando = cat;
    this.nombreEditado = cat.nombre;
  }

  // Cancelar edicion
  cancelarEdicion(): void {
    this.categoriaEditando = null;
    this.nombreEditado = '';
  }

  // Guardar edicion
  guardarEdicion(): void {
    if (!this.nombreEditado.trim() || !this.categoriaEditando) return;
    this.categoriaService.editar(this.categoriaEditando.id_categoria, { nombre: this.nombreEditado }).subscribe({
      next: (res: any) => {
        if (res.resultado === 'OK') {
          this.mensajeAlerta = 'Categoría actualizada con éxito.';
          this.cargarCategorias();
          this.cancelarEdicion();
          setTimeout(() => this.mensajeAlerta = '', 3000);
        }
      },
      error: (err: any) => console.error('Error al editar', err)
    });
  }
}
