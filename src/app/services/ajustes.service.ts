import { Injectable } from '@angular/core';

export interface ConfigAjustes {
  alertaSonora: boolean;
  impresionAutomatica: boolean;
  tiendaAbierta: boolean;
  negocio: {
    nombre: string;
    nit: string;
    telefono: string;
    direccion: string;
    mensajeRecibo: string;
    tiempoEstimado: number;
  };
  finanzas: {
    impuestoPorcentaje: number;
    propinaSugerida: number;
    moneda: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AjustesService {
  private readonly STORAGE_KEY = 'ajustes_restaurante_os';

  private readonly valoresPorDefecto: ConfigAjustes = {
    alertaSonora: true,
    impresionAutomatica: false,
    tiendaAbierta: true,
    negocio: {
      nombre: 'Restaurante',
      nit: '901.456.789-1',
      telefono: '3001234567',
      direccion: 'Calle Principal #10-20',
      mensajeRecibo: '¡Gracias por tu compra! Vuelve pronto.',
      tiempoEstimado: 25
    },
    finanzas: {
      impuestoPorcentaje: 8,
      propinaSugerida: 10,
      moneda: 'COP'
    }
  };

  obtenerAjustes(): ConfigAjustes {
    try {
      const guardado = localStorage.getItem(this.STORAGE_KEY);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        return {
          ...this.valoresPorDefecto,
          ...parsed,
          negocio: { ...this.valoresPorDefecto.negocio, ...(parsed.negocio || {}) },
          finanzas: { ...this.valoresPorDefecto.finanzas, ...(parsed.finanzas || {}) }
        };
      }
    } catch {
      // Ignorar errores de parseo
    }
    return JSON.parse(JSON.stringify(this.valoresPorDefecto));
  }

  guardarAjustes(config: ConfigAjustes): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
  }
}
