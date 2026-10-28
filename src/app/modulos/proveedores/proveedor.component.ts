import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedorService } from '../../services/proveedor.service';
import { ReporteService } from '../../services/reporte.service';

@Component({
  selector: 'app-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedor.component.html',
  styleUrls: ['./proveedor.component.css']
})
export class ProveedorComponent implements OnInit {
  private proveedorService = inject(ProveedorService);
  private reporteService = inject(ReporteService);
  private cdr = inject(ChangeDetectorRef);

  public listaProveedores: any[] = [];
  public busqueda: string = '';
  public paginaActual: number = 1;
  public itemsPorPagina: number = 8;
  public modalAbierto: boolean = false;
  public nuevoProveedor: any = this.crearObjetoVacio();
  public idProveedorEditar: number = 0;

  ngOnInit(): void {
    this.cargarProveedores();
  }

  crearObjetoVacio(): any {
    return { nombre: '', contacto: '', telefono: '', correo: '', ciudad: '' };
  }

  cargarProveedores(): void {
    this.proveedorService.consulta().subscribe({
      next: (datos) => {
        this.listaProveedores = Array.isArray(datos) ? datos : [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar proveedores:', err);
        this.listaProveedores = [];
        this.cdr.detectChanges();
      }
    });
  }

  get proveedoresFiltrados(): any[] {
    const term = this.busqueda.toLowerCase().trim();
    if (!term) return this.listaProveedores;
    return this.listaProveedores.filter(p =>
      (p.nombre || '').toLowerCase().includes(term) ||
      (p.contacto || '').toLowerCase().includes(term) ||
      (p.telefono || '').includes(term) ||
      (p.correo || '').toLowerCase().includes(term) ||
      (p.ciudad || '').toLowerCase().includes(term)
    );
  }

  get proveedoresPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.proveedoresFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.proveedoresFiltrados.length / this.itemsPorPagina);
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
    this.nuevoProveedor = this.crearObjetoVacio();
    this.idProveedorEditar = 0;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardarProveedor(): void {
    const datos = {
      nombre: this.nuevoProveedor.nombre,
      contacto: this.nuevoProveedor.contacto || '',
      telefono: this.nuevoProveedor.telefono || '',
      correo: this.nuevoProveedor.correo || '',
      ciudad: this.nuevoProveedor.ciudad || ''
    };

    if (this.idProveedorEditar > 0) {
      this.proveedorService.editar(this.idProveedorEditar, datos).subscribe({
        next: () => {
          this.cargarProveedores();
          this.cerrarModal();
        },
        error: (err) => console.error('Error al editar proveedor:', err)
      });
    } else {
      this.proveedorService.insertar(datos).subscribe({
        next: () => {
          this.cargarProveedores();
          this.cerrarModal();
        },
        error: (err) => console.error('Error al insertar proveedor:', err)
      });
    }
  }

  editarProveedor(prov: any): void {
    this.nuevoProveedor = { ...prov };
    this.idProveedorEditar = prov.id_proveedor;
    this.modalAbierto = true;
  }

  eliminarProveedor(id: number, nombre: string): void {
    if (!confirm(`¿Estás seguro de eliminar al proveedor "${nombre}"?`)) {
      return;
    }
    this.proveedorService.eliminar(id).subscribe({
      next: () => this.cargarProveedores(),
      error: (err) => console.error('Error al eliminar proveedor:', err)
    });
  }

  descargarExcel(): void {
    const encabezados = ['ID', 'Proveedor', 'Contacto', 'Telefono', 'Correo', 'Ciudad'];
    const filas = this.proveedoresFiltrados.map(p => [
      p.id_proveedor || '',
      p.nombre || '',
      p.contacto || '---',
      p.telefono || '---',
      p.correo || '---',
      p.ciudad || 'No definida'
    ]);
    this.reporteService.exportarExcelCSV('Reporte_Proveedores', encabezados, filas);
  }

  descargarPDF(): void {
    const encabezados = ['Proveedor', 'Persona de Contacto', 'Teléfono', 'Correo Electrónico', 'Ciudad'];
    const filas = this.proveedoresFiltrados.map(p => [
      p.nombre || '',
      p.contacto || '---',
      p.telefono || '---',
      p.correo || '---',
      p.ciudad || 'No definida'
    ]);
    this.reporteService.exportarPDF(
      'Directorio General de Proveedores',
      'Proveedores y distribuidores activos del restaurante',
      encabezados,
      filas,
      `Total de proveedores registrados en el reporte: ${this.proveedoresFiltrados.length}`
    );
  }
}
