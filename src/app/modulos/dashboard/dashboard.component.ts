import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService } from '../../services/pedido.service';
import { ClienteService } from '../../services/cliente.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
})
export class Dashboard implements OnInit {
  private pedidoService = inject(PedidoService);
  private clienteService = inject(ClienteService);
  private cdr = inject(ChangeDetectorRef);

  totalVentas = 0;
  totalPedidos = 0;
  totalClientes = 0;
  pedidosRecientes: any[] = [];

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.pedidoService.consulta().subscribe({
      next: (pedidos: any[]) => {
        this.pedidosRecientes = pedidos.slice(0, 5);
        this.totalPedidos = pedidos.length;
        this.totalVentas = pedidos.reduce((sum: number, p: any) => sum + parseFloat(p.total || 0), 0);
        this.cdr.detectChanges();
      }
    });

    this.clienteService.consulta().subscribe({
      next: (clientes: any[]) => {
        this.totalClientes = Array.isArray(clientes) ? clientes.length : 0;
        this.cdr.detectChanges();
      }
    });
  }
}
