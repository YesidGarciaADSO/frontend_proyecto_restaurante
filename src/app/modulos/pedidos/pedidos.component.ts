import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../services/pedido.service';
import { ProductoService } from '../../services/producto.service';
import { PagoService } from '../../services/pago.service';
import { ClienteService } from '../../services/cliente.service';
import { LoginService } from '../../services/login.service';
import { AjustesService } from '../../services/ajustes.service';
import { ReporteService } from '../../services/reporte.service';

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
  private pagoService = inject(PagoService);
  private clienteService = inject(ClienteService);
  private authService = inject(LoginService);
  private ajustesService = inject(AjustesService);
  private reporteService = inject(ReporteService);
  private cdr = inject(ChangeDetectorRef);

  public listaPedidos: any[] = [];
  public listaProductos: any[] = [];
  public listaClientes: any[] = [];
  public clienteSeleccionadoId: string = '';
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
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clienteService.consulta().subscribe({
      next: (res: any[]) => {
        this.listaClientes = Array.isArray(res) ? res : [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando clientes:', err)
    });
  }

  onNombreClienteChange(valor: string): void {
    this.nuevoCliente = valor;
    if (!valor || !valor.trim()) return;

    // Buscar si coincide por nombre o si el valor contiene parte del nombre
    const textoBuscado = valor.trim().toLowerCase();
    const cli = this.listaClientes.find(c => {
      const nom = (c.nombre || '').trim().toLowerCase();
      return nom === textoBuscado || textoBuscado.startsWith(nom);
    });

    if (cli) {
      if (cli.nombre) {
        this.nuevoCliente = cli.nombre;
      }
      if (cli.telefono) {
        this.nuevoTelefono = cli.telefono;
      }
      if (cli.direccion) {
        this.nuevaDireccion = cli.direccion;
        // Si el cliente tiene dirección guardada y aún está en local, cambiar inteligentemente a domicilio
        if (this.nuevoTipo === 'local' && cli.direccion.trim() !== '') {
          this.nuevoTipo = 'domicilio';
        }
      }
      this.cdr.detectChanges();
    }
  }

  // Permisos granulares segun rol
  get rolActual(): string {
    return this.authService.obtenerRol().toLowerCase();
  }

  get esAdmin(): boolean {
    return this.rolActual.includes('admin');
  }

  get esCajero(): boolean {
    return this.rolActual.includes('cajero');
  }

  get esCocinero(): boolean {
    return this.rolActual.includes('cocinero');
  }

  get esMesero(): boolean {
    return this.rolActual.includes('mesero');
  }

  // Crear pedido: Admin, Cajero, Mesero
  get puedeCrearPedido(): boolean {
    return this.esAdmin || this.esCajero || this.esMesero;
  }

  // Pasar a cocina / despachar de cocina: Admin, Cocinero, Cajero
  get puedeGestionarCocina(): boolean {
    return this.esAdmin || this.esCocinero || this.esCajero;
  }

  // Marcar entregado en mesa / caja: Admin, Cajero, Mesero
  get puedeEntregarPedido(): boolean {
    return this.esAdmin || this.esCajero || this.esMesero;
  }

  // Cancelar pedido: Solo Admin y Cajero
  get puedeCancelarPedido(): boolean {
    return this.esAdmin || this.esCajero;
  }

  // Descargar reportes: Admin y Cajero
  get puedeDescargarReportes(): boolean {
    return this.esAdmin || this.esCajero;
  }

  cargarPedidos(): void {
    this.pedidoService.consulta().subscribe({
      next: (res: any) => {
        this.listaPedidos = Array.isArray(res) ? res : [];
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

  get totalPedidosActivos(): number {
    return this.listaPedidos.filter(p => {
      const est = (p.estado || '').toLowerCase();
      return est === 'pendiente' || est === 'en_preparacion' || est === 'confirmado' || est === 'en_camino';
    }).length;
  }

  get totalEnCocina(): number {
    return this.listaPedidos.filter(p => {
      const est = (p.estado || '').toLowerCase();
      return est === 'pendiente' || est === 'en_preparacion' || est === 'confirmado';
    }).length;
  }

  get totalValorEfectivo(): number {
    return this.listaPedidos
      .filter(p => (p.estado || '').toLowerCase() !== 'cancelado')
      .reduce((acc, p) => acc + parseFloat(p.total || 0), 0);
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
    if (!this.puedeCrearPedido) return;
    this.clienteSeleccionadoId = '';
    this.nuevoCliente = '';
    this.nuevoTelefono = '';
    this.nuevaDireccion = '';
    this.nuevoTipo = 'local';
    this.nuevoMetodoPago = 'Efectivo';
    this.productosPedido = [];
    this.productoSeleccionado = '';
    this.cantidadProducto = 1;
    this.cargarClientes();
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
    const copiaProductos = [...this.productosPedido];
    const totalOrden = this.totalPedido;
    const clienteNombre = this.nuevoCliente;
    const clienteTelefono = this.nuevoTelefono;
    const tipoOrden = this.nuevoTipo;
    const metodoOrden = this.nuevoMetodoPago;
    const dirOrden = this.nuevaDireccion;

    const payload = {
      cliente: this.nuevoCliente,
      telefono: this.nuevoTelefono,
      direccion: this.nuevaDireccion,
      tipo: this.nuevoTipo,
      metodo_pago: this.nuevoMetodoPago,
      total: totalOrden,
      productos: this.productosPedido.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
      })),
    };

    this.pedidoService.insertar(payload).subscribe({
      next: (res: any) => {
        const idCreado = res?.id_pedido || Date.now();

        // Indexar cliente en directorio si no existía previamente
        const clienteYaExiste = this.listaClientes.some(
          c => (c.nombre || '').toLowerCase() === clienteNombre.toLowerCase() ||
               (clienteTelefono && (c.telefono || '') === clienteTelefono)
        );
        if (!clienteYaExiste && clienteNombre.trim()) {
          this.clienteService.insertar({
            nombre: clienteNombre,
            telefono: clienteTelefono || '---',
            direccion: dirOrden || 'Local',
            fo_ciudad: 1
          }).subscribe({ error: () => {} });
        }

        // Sincronizar descuento de stock en cada producto vendido
        for (const item of copiaProductos) {
          const prodOriginal = this.listaProductos.find(p => p.id_producto == item.id_producto);
          if (prodOriginal) {
            const nuevoStock = Math.max(0, (parseInt(prodOriginal.stock) || 0) - item.cantidad);
            this.productoService
              .editar(prodOriginal.id_producto, {
                nombre: prodOriginal.nombre,
                descripcion: prodOriginal.descripcion || '',
                precio: parseFloat(prodOriginal.precio) || 0,
                stock: nuevoStock,
                fo_categoria: prodOriginal.fo_categoria || 1,
                activo: prodOriginal.activo ?? 1,
                proveedor: prodOriginal.proveedor || ''
              })
              .subscribe({ error: () => {} });
          }
        }

        // Registrar el pago automaticamente en el modulo de Pagos
        if (res?.id_pedido) {
          this.pagoService
            .insertar({
              fo_pedido: res.id_pedido,
              monto: totalOrden,
              metodo: metodoOrden.toLowerCase(),
              estado: 'pendiente'
            })
            .subscribe({ error: () => {} });
        }

        // Si en Ajustes esta activa la auto-impresion de comandas, imprimimos el ticket POS
        const config = this.ajustesService.obtenerAjustes();
        if (config.impresionAutomatica) {
          this.reporteService.imprimirTicketPOS({
            idPedido: idCreado,
            cliente: clienteNombre,
            tipo: tipoOrden,
            metodoPago: metodoOrden,
            direccion: dirOrden,
            total: totalOrden,
            productos: copiaProductos
          });
        }

        this.guardandoPedido = false;
        this.mostrarModalNuevo = false;
        this.cargarPedidos();
        this.cargarProductos();
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
    if (!this.puedeCancelarPedido) return;
    if (confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
      this.pedidoService.eliminar(id).subscribe({
        next: () => this.cargarPedidos(),
        error: (err) => console.error('Error al cancelar pedido:', err),
      });
    }
  }

  imprimirComanda(ped: any): void {
    this.reporteService.imprimirTicketPOS({
      idPedido: ped.id_pedido,
      cliente: ped.nombre_cliente || 'Cliente General',
      fecha: ped.fecha,
      tipo: ped.tipo || 'Local',
      metodoPago: ped.metodo_pago || 'Efectivo',
      direccion: ped.direccion_entrega || '',
      estado: ped.estado,
      total: Number(ped.total || 0),
      productos: Array.isArray(ped.productos) ? ped.productos : []
    });
  }

  descargarExcel(): void {
    const encabezados = ['ID Pedido', 'Cliente', 'Tipo', 'Metodo de Pago', 'Total', 'Estado', 'Fecha'];
    const filas = this.pedidosFiltrados.map(p => [
      `#${p.id_pedido}`,
      p.nombre_cliente || 'Cliente General',
      p.tipo || 'Local',
      p.metodo_pago || 'Efectivo',
      p.total || 0,
      p.estado || 'pendiente',
      p.fecha || ''
    ]);
    this.reporteService.exportarExcelCSV('Reporte_Pedidos', encabezados, filas);
  }

  descargarPDF(): void {
    const encabezados = ['# Pedido', 'Cliente', 'Tipo', 'Método Pago', 'Total', 'Estado'];
    const totalPedidosValor = this.pedidosFiltrados.reduce((acc, p) => acc + parseFloat(p.total || 0), 0);
    const filas = this.pedidosFiltrados.map(p => [
      `#${p.id_pedido}`,
      p.nombre_cliente || 'Cliente General',
      (p.tipo || 'Local').toUpperCase(),
      p.metodo_pago || 'Efectivo',
      `$${Number(p.total || 0).toLocaleString('es-CO')}`,
      (p.estado || 'pendiente').replace('_', ' ').toUpperCase()
    ]);
    this.reporteService.exportarPDF(
      'Reporte General de Pedidos',
      `Filtro aplicado: ${this.filtroEstado.toUpperCase()}`,
      encabezados,
      filas,
      `Valor Total Acumulado de Pedidos Listados: $${totalPedidosValor.toLocaleString('es-CO')}`
    );
  }
}
