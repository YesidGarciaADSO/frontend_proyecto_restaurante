import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html'
})
export class UsuariosComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private cdr = inject(ChangeDetectorRef);

  public listaUsuarios: any[] = [];
  public listaRoles: any[] = [];
  public cargando: boolean = true;
  public editando: boolean = false;
  private idUsuarioEditando: number | null = null;

  public busqueda: string = '';
  public paginaActual: number = 1;
  public itemsPorPagina: number = 8;

  public usuarioForm = {
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    telefono: '',
    fo_rol: ''
  };

  ngOnInit() {
    this.cargarDatos();
    this.cargarRoles();
  }

  cargarDatos() {
    this.cargando = true;
    this.usuarioService.consulta().subscribe({
      next: (datos) => {
        this.listaUsuarios = Array.isArray(datos) ? datos : [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarRoles() {
    this.usuarioService.roles().subscribe({
      next: (roles) => {
        this.listaRoles = Array.isArray(roles) ? roles : [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando roles:', err)
    });
  }

  get usuariosFiltrados(): any[] {
    const term = this.busqueda.toLowerCase().trim();
    if (!term) return this.listaUsuarios;
    return this.listaUsuarios.filter(u =>
      (u.nombre || '').toLowerCase().includes(term) ||
      (u.apellido || '').toLowerCase().includes(term) ||
      (u.correo || '').toLowerCase().includes(term) ||
      (u.nombre_rol || '').toLowerCase().includes(term)
    );
  }

  get usuariosPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.usuariosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.usuariosFiltrados.length / this.itemsPorPagina);
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

  seleccionarUsuario(u: any) {
    this.editando = true;
    this.idUsuarioEditando = u.id_usuario;
    this.usuarioForm = {
      nombre: u.nombre,
      apellido: u.apellido,
      correo: u.correo,
      password: '',
      telefono: u.telefono || '',
      fo_rol: u.fo_rol
    };
  }

  guardarUsuario() {
    if (this.editando && this.idUsuarioEditando) {
      this.usuarioService.editar(this.idUsuarioEditando, this.usuarioForm).subscribe({
        next: (res: any) => {
          if (res.resultado === 'OK') {
            this.cargarDatos();
            this.limpiarFormulario();
          }
        },
        error: (err) => console.error('Error al guardar:', err)
      });
    } else {
      this.usuarioService.insertar(this.usuarioForm).subscribe({
        next: (res: any) => {
          if (res.resultado === 'OK') {
            this.cargarDatos();
            this.limpiarFormulario();
          }
        },
        error: (err) => console.error('Error al guardar:', err)
      });
    }
  }

  cambiarEstado(id: number, estadoActual: number) {
    const nuevoEstado = estadoActual === 1 ? 0 : 1;
    this.usuarioService.cambiarEstado(id, nuevoEstado).subscribe({
      next: () => this.cargarDatos(),
      error: (err) => console.error('Error al cambiar estado:', err)
    });
  }

  limpiarFormulario() {
    this.editando = false;
    this.idUsuarioEditando = null;
    this.usuarioForm = { nombre: '', apellido: '', correo: '', password: '', telefono: '', fo_rol: '' };
  }
}
