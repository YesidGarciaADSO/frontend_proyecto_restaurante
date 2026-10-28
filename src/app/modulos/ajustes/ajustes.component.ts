import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AjustesService } from '../../services/ajustes.service';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ajustes.component.html'
})
export class AjustesComponent implements OnInit {
  private ajustesService = inject(AjustesService);
  private cdr = inject(ChangeDetectorRef);

  public mensajeGuardado: string = '';

  public alertaSonora: boolean = true;
  public impresionAutomatica: boolean = false;
  public tiendaAbierta: boolean = true;

  public negocio = {
    nombre: 'Restaurante',
    nit: '123456789-1',
    telefono: '3001234567',
    direccion: 'Calle Principal #10-20',
    mensajeRecibo: '¡Gracias por tu compra! Vuelve pronto.',
    tiempoEstimado: 25
  };

  public finanzas = {
    impuestoPorcentaje: 8,
    propinaSugerida: 10,
    moneda: 'COP'
  };

  ngOnInit(): void {
    const config = this.ajustesService.obtenerAjustes();
    this.alertaSonora = config.alertaSonora;
    this.impresionAutomatica = config.impresionAutomatica;
    this.tiendaAbierta = config.tiendaAbierta;
    this.negocio = { ...config.negocio };
    this.finanzas = { ...config.finanzas };
    this.cdr.detectChanges();
  }

  guardarAjustes(): void {
    this.ajustesService.guardarAjustes({
      alertaSonora: this.alertaSonora,
      impresionAutomatica: this.impresionAutomatica,
      tiendaAbierta: this.tiendaAbierta,
      negocio: { ...this.negocio },
      finanzas: { ...this.finanzas }
    });
    this.mensajeGuardado = 'Ajustes guardados y aplicados en el sistema.';
    this.cdr.detectChanges();
    setTimeout(() => (this.mensajeGuardado = ''), 3000);
  }

  toggleTienda(): void {
    this.tiendaAbierta = !this.tiendaAbierta;
    this.guardarAjustes();
  }

  toggleAlertaSonora(): void {
    this.alertaSonora = !this.alertaSonora;
    this.guardarAjustes();
  }

  toggleImpresion(): void {
    this.impresionAutomatica = !this.impresionAutomatica;
    this.guardarAjustes();
  }
}
