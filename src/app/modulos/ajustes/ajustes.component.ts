import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ajustes.component.html'
})
export class AjustesComponent implements OnInit {

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

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cdr.detectChanges();
  }

  guardarAjustes(): void {
    this.mensajeGuardado = 'Ajustes guardados correctamente.';
    this.cdr.detectChanges();
    setTimeout(() => this.mensajeGuardado = '', 3000);
  }

  toggleTienda(): void {
    this.tiendaAbierta = !this.tiendaAbierta;
  }

  toggleAlertaSonora(): void {
    this.alertaSonora = !this.alertaSonora;
  }

  toggleImpresion(): void {
    this.impresionAutomatica = !this.impresionAutomatica;
  }
}
