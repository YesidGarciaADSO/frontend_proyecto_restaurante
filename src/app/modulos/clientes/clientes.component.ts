import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../services/cliente.service';
import { CiudadService } from '../../services/ciudad.service';
import { DepartamentoService } from '../../services/departamento.service';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html'
})
export class ClientesComponent implements OnInit {
  // Servicios
  private clienteService = inject(ClienteService);
  private ciudadService = inject(CiudadService);
  private departamentoService = inject(DepartamentoService);
  private authService = inject(LoginService);
  private cdr = inject(ChangeDetectorRef);

  get puedeEliminarCliente(): boolean {
    const rol = this.authService.obtenerRol().toLowerCase();
    return rol.includes('admin') || rol.includes('cajero');
  }

  // Lista clientes
  listaClientes: any[] = [];
  // Lista departamentos
  listaDepartamentos: any[] = [];
  // Ciudades por depto
  listaCiudades: any[] = [];
  // Depto seleccionado
  idDepartamentoSeleccionado: number = 0;

  // Busqueda
  busqueda: string = '';
  // Paginacion
  paginaActual: number = 1;
  itemsPorPagina: number = 8;

  // Datos nuevo cliente
  nuevoCliente = { nombre: '', telefono: '', direccion: '', fo_ciudad: 0 };
  // Id cliente editar
  idClienteEditar: number = 0;

  // Modal abierto
  public modalAbierto: boolean = false;

  // Carga inicial
  ngOnInit(): void {
    this.cargarDatos();
    this.cargarDepartamentos();
  }

  // Cargar clientes
  cargarDatos(): void {
    this.clienteService.consulta().subscribe({
      next: (res) => {
        this.listaClientes = Array.isArray(res) ? [...res] : [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Fallo al consultar registros:', err);
        this.listaClientes = [];
      }
    });
  }

  // Cargar departamentos
  cargarDepartamentos(): void {
    this.departamentoService.consulta().subscribe({
      next: (res) => this.listaDepartamentos = Array.isArray(res) ? res : [],
      error: (err) => console.error('Fallo al obtener territorios:', err)
    });
  }

  // Filtrar clientes
  get clientesFiltrados(): any[] {
    const term = this.busqueda.toLowerCase().trim();
    if (!term) return this.listaClientes;
    return this.listaClientes.filter(c =>
      (c.nombre || '').toLowerCase().includes(term) ||
      (c.telefono || '').includes(term) ||
      (c.direccion || '').toLowerCase().includes(term) ||
      (c.nombre_ciudad || '').toLowerCase().includes(term)
    );
  }

  // Pagina actual
  get clientesPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.clientesFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  // Total paginas
  get totalPaginas(): number {
    return Math.ceil(this.clientesFiltrados.length / this.itemsPorPagina);
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
  onBusqueda(): void {
    this.paginaActual = 1;
  }

  // Cambio departamento
  onDepartamentoChange(): void {
    this.nuevoCliente.fo_ciudad = 0;
    this.listaCiudades = [];
    if (this.idDepartamentoSeleccionado > 0) {
      this.ciudadService.filtrarPorDepartamento(this.idDepartamentoSeleccionado).subscribe({
        next: (res) => this.listaCiudades = Array.isArray(res) ? res : [],
        error: (err) => console.error("Fallo al filtrar zonas:", err)
      });
    }
  }

  // Abrir modal
  abrirModal(): void {
    this.nuevoCliente = { nombre: '', telefono: '', direccion: '', fo_ciudad: 0 };
    this.idClienteEditar = 0;
    this.idDepartamentoSeleccionado = 0;
    this.listaCiudades = [];
    this.modalAbierto = true;
  }

  // Cerrar modal
  cerrarModal(): void {
    this.modalAbierto = false;
  }

  // Guardar cliente
  guardarCliente(): void {
    if (!this.nuevoCliente.nombre.trim() || this.nuevoCliente.fo_ciudad === 0) {
      alert('El nombre y la ciudad son obligatorios.');
      return;
    }

    const datosParaEnviar = {
      nombre: this.nuevoCliente.nombre.trim(),
      telefono: this.nuevoCliente.telefono?.trim() || '',
      direccion: this.nuevoCliente.direccion?.trim() || '',
      fo_ciudad: Number(this.nuevoCliente.fo_ciudad)
    };

    if (this.idClienteEditar > 0) {
      this.clienteService.editar(this.idClienteEditar, datosParaEnviar).subscribe({
        next: (res) => {
          if (res && res.resultado === 'OK') {
            this.finalizarFormulario();
          } else {
            alert(res.mensaje || 'Ocurrió un inconveniente al actualizar.');
          }
        },
        error: (err) => console.error('Error HTTP al editar:', err)
      });
    } else {
      this.clienteService.insertar(datosParaEnviar).subscribe({
        next: (res) => {
          if (res && res.resultado === 'OK') {
            this.finalizarFormulario();
          } else {
            alert(res.mensaje || 'Ocurrió un inconveniente al guardar.');
          }
        },
        error: (err) => console.error('Error en la comunicación HTTP:', err)
      });
    }
  }

  // Limpiar formulario
  private finalizarFormulario(): void {
    this.nuevoCliente = { nombre: '', telefono: '', direccion: '', fo_ciudad: 0 };
    this.idDepartamentoSeleccionado = 0;
    this.listaCiudades = [];
    this.idClienteEditar = 0;
    this.cerrarModal();
    setTimeout(() => { this.cargarDatos(); }, 50);
  }

  // Eliminar cliente
  eliminarCliente(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      this.clienteService.eliminar(id).subscribe({
        next: (res) => {
          if (res && res.resultado === 'OK') {
            setTimeout(() => this.cargarDatos(), 50);
          } else {
            alert(res.mensaje || 'No se pudo eliminar el cliente.');
          }
        },
        error: (err) => console.error('Error HTTP al eliminar:', err)
      });
    }
  }

  // Editar cliente
  seleccionarClienteParaEditar(cli: any): void {
    this.idClienteEditar = Number(cli.id_cliente);
    this.nuevoCliente = {
      nombre: cli.nombre,
      telefono: cli.telefono,
      direccion: cli.direccion,
      fo_ciudad: Number(cli.fo_ciudad)
    };
    if (cli.id_departamento) {
      this.idDepartamentoSeleccionado = Number(cli.id_departamento);
      this.ciudadService.filtrarPorDepartamento(this.idDepartamentoSeleccionado).subscribe({
        next: (res) => this.listaCiudades = Array.isArray(res) ? res : [],
        error: (err) => console.error(err)
      });
    }
    this.modalAbierto = true;
  }
}
