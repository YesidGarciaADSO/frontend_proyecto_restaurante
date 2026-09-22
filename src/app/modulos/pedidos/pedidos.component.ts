import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../services/pedido.service';
import { ProductoService } from '../../services/producto.service';

interface ItemPedido {
  id_producto: number;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
}

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos.component.html',
})
export class Pedidos implements OnInit {
  private pedidoService = inject(PedidoService);
  private productoService = inject(ProductoService);
  private cdr = inject(ChangeDetectorRef);

  public listaPedidos: any[] = [];
  public listaProductos: any[] = [];
  public mostrarModalNuevo = false;

  public nuevoCliente: string = '';
  public nuevoTelefono: string = '';
  public nuevaDireccion: string = '';
  public nuevoTipo: string = 'local';
  public nuevoMetodoPago: string = 'Efectivo';
  public productosPedido: ItemPedido[] = [];
  public productoSeleccionado: string = '';
  public cantidadProducto: number = 1;
  public guardandoPedido: boolean = false;

  public filtroEstado: string = 'todos';
  public paginaActual: number = 1;
  public itemsPorPagina: number = 8;

  ngOnInit(): void {
    this.cargarPedidos();
    this.cargarProductos();
  }

  cargarPedidos(): void {
    this.pedidoService.consulta().subscribe({
      next: (res: any) => {
        this.listaPedidos = res;
        this.paginaActual = 1;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando pedidos:', err),
    });
  }

  cargarProductos(): void {
    this.productoService.consulta().subscribe({
      next: (res: any) => {
        this.listaProductos = Array.isArray(res) ? res.filter((p: any) => p.activo == 1) : [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando productos:', err),
    });
  }

  get pedidosFiltrados(): any[] {
    if (this.filtroEstado === 'todos') return this.listaPedidos;
    return this.listaPedidos.filter(p => p.estado?.toLowerCase() === this.filtroEstado);
  }

  get pedidosPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.pedidosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.pedidosFiltrados.length / this.itemsPorPagina);
  }

  get paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  get totalPedido(): number {
    return this.productosPedido.reduce((sum, item) => sum + item.subtotal, 0);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) this.paginaActual = pagina;
  }

  cambiarFiltro(): void {
    this.paginaActual = 1;
  }

  nuevoPedido(): void {
    this.nuevoCliente = '';
    this.nuevoTelefono = '';
    this.nuevaDireccion = '';
    this.nuevoTipo = 'local';
    this.nuevoMetodoPago = 'Efectivo';
    this.productosPedido = [];
    this.productoSeleccionado = '';
    this.cantidadProducto = 1;
    this.mostrarModalNuevo = true;
  }

  agregarProducto(): void {
    if (!this.productoSeleccionado) return;
    const prod = this.listaProductos.find(p => p.id_producto == this.productoSeleccionado);
    if (!prod) return;

    const existente = this.productosPedido.find(item => item.id_producto == prod.id_producto);
    if (existente) {
      existente.cantidad += this.cantidadProducto;
      existente.subtotal = existente.cantidad * existente.precio;
    } else {
      this.productosPedido.push({
        id_producto: prod.id_producto,
        nombre: prod.nombre,
        precio: parseFloat(prod.precio),
        cantidad: this.cantidadProducto,
        subtotal: parseFloat(prod.precio) * this.cantidadProducto,
      });
    }
    this.productoSeleccionado = '';
    this.cantidadProducto = 1;
    this.cdr.detectChanges();
  }

  actualizarSubtotal(index: number): void {
    const item = this.productosPedido[index];
    if (item.cantidad < 1) item.cantidad = 1;
    item.subtotal = item.cantidad * item.precio;
  }

  eliminarProducto(index: number): void {
    this.productosPedido.splice(index, 1);
  }

  confirmarNuevoPedido(): void {
    if (!this.nuevoCliente.trim() || this.productosPedido.length === 0) return;
    this.guardandoPedido = true;
    const payload = {
      cliente: this.nuevoCliente,
      telefono: this.nuevoTelefono,
      direccion: this.nuevaDireccion,
      tipo: this.nuevoTipo,
      metodo_pago: this.nuevoMetodoPago,
      total: this.totalPedido,
      productos: this.productosPedido.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
      })),
    };
    this.pedidoService.insertar(payload).subscribe({
      next: () => {
        this.guardandoPedido = false;
        this.mostrarModalNuevo = false;
        this.cargarPedidos();
      },
      error: (err) => {
        this.guardandoPedido = false;
        console.error('Error al crear pedido:', err);
        alert('Error al crear el pedido.');
        this.cdr.detectChanges();
      },
    });
  }

  actualizarEstado(id: number, nuevoEstado: string): void {
    this.pedidoService.cambiarEstado(id, { estado: nuevoEstado }).subscribe({
      next: () => this.cargarPedidos(),
      error: (err) => console.error('Error al cambiar estado:', err),
    });
  }

  cancelarPedido(id: number): void {
    if (confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
      this.pedidoService.eliminar(id).subscribe({
        next: () => this.cargarPedidos(),
        error: (err) => console.error('Error al cancelar pedido:', err),
      });
    }
  }
}
