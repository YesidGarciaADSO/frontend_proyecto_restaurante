import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService } from '../../services/pedido.service';
import { ClienteService } from '../../services/cliente.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  private pedidoService = inject(PedidoService);
  private clienteService = inject(ClienteService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('chartMetodos') chartMetodosRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartEstados') chartEstadosRef?: ElementRef<HTMLCanvasElement>;

  private chartMetodosInstance: Chart | null = null;
  private chartEstadosInstance: Chart | null = null;

  totalVentas = 0;
  totalPedidos = 0;
  totalClientes = 0;
  pedidosEntregados = 0;
  pedidosRecientes: any[] = [];
  private todosLosPedidos: any[] = [];

  ngOnInit() {
    this.cargarDatos();
  }

  ngAfterViewInit() {
    if (this.todosLosPedidos.length > 0) {
      this.renderizarGraficas();
    }
  }

  ngOnDestroy() {
    this.chartMetodosInstance?.destroy();
    this.chartEstadosInstance?.destroy();
  }

  cargarDatos() {
    this.pedidoService.consulta().subscribe({
      next: (pedidos: any[]) => {
        const lista = Array.isArray(pedidos) ? pedidos : [];
        this.todosLosPedidos = lista;
        this.pedidosRecientes = lista.slice(0, 5);
        this.totalPedidos = lista.length;

        // Solo sumamos las ventas efectivas (no canceladas)
        const ventasEfectivas = lista.filter(p => (p.estado || '').toLowerCase() !== 'cancelado');
        this.totalVentas = ventasEfectivas.reduce((sum: number, p: any) => sum + parseFloat(p.total || 0), 0);
        this.pedidosEntregados = lista.filter(p => (p.estado || '').toLowerCase() === 'entregado').length;

        this.cdr.detectChanges();
        setTimeout(() => this.renderizarGraficas(), 50);
      }
    });

    this.clienteService.consulta().subscribe({
      next: (clientes: any[]) => {
        this.totalClientes = Array.isArray(clientes) ? clientes.length : 0;
        this.cdr.detectChanges();
      }
    });
  }

  private renderizarGraficas() {
    if (!this.chartMetodosRef?.nativeElement || !this.chartEstadosRef?.nativeElement) {
      return;
    }

    // 1. Grafica de barras: Ingresos por Metodo de Pago (sin cancelados)
    const metodosMap: Record<string, number> = {
      Efectivo: 0,
      Nequi: 0,
      Tarjeta: 0,
      Daviplata: 0
    };

    for (const p of this.todosLosPedidos) {
      if ((p.estado || '').toLowerCase() === 'cancelado') continue;
      const metodo = p.metodo_pago || 'Efectivo';
      const key =
        Object.keys(metodosMap).find(k => k.toLowerCase() === String(metodo).toLowerCase()) || 'Efectivo';
      metodosMap[key] += parseFloat(p.total || 0);
    }

    this.chartMetodosInstance?.destroy();
    this.chartMetodosInstance = new Chart(this.chartMetodosRef.nativeElement, {
      type: 'bar',
      data: {
        labels: Object.keys(metodosMap),
        datasets: [
          {
            label: 'Ingresos ($ COP)',
            data: Object.values(metodosMap),
            backgroundColor: ['rgba(214, 35, 0, 0.8)', 'rgba(245, 166, 35, 0.8)', 'rgba(46, 125, 50, 0.8)', 'rgba(13, 110, 253, 0.8)'],
            borderRadius: 8,
            maxBarThickness: 48
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    // 2. Grafica de Dona: Distribucion de Pedidos por Estado
    const estadosConteo = {
      Entregados: 0,
      'En Camino': 0,
      'En Cocina': 0,
      Pendientes: 0,
      Cancelados: 0
    };

    for (const p of this.todosLosPedidos) {
      const est = (p.estado || 'pendiente').toLowerCase();
      if (est === 'entregado') estadosConteo.Entregados++;
      else if (est === 'en_camino') estadosConteo['En Camino']++;
      else if (est === 'en_preparacion' || est === 'confirmado') estadosConteo['En Cocina']++;
      else if (est === 'cancelado') estadosConteo.Cancelados++;
      else estadosConteo.Pendientes++;
    }

    this.chartEstadosInstance?.destroy();
    this.chartEstadosInstance = new Chart(this.chartEstadosRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: Object.keys(estadosConteo),
        datasets: [
          {
            data: Object.values(estadosConteo),
            backgroundColor: ['#2e7d32', '#f5a623', '#0d6efd', '#ff7043', '#adb5bd'],
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}
