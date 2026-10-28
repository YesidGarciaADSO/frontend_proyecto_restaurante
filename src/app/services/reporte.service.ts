import { Injectable, inject } from '@angular/core';
import { AjustesService } from './ajustes.service';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private ajustesService = inject(AjustesService);

  // Descarga un archivo CSV compatible con Microsoft Excel (con BOM UTF-8)
  exportarExcelCSV(nombreArchivo: string, encabezados: string[], filas: any[][]): void {
    const separador = ';';
    const escapar = (valor: any): string => {
      if (valor === null || valor === undefined) return '';
      const texto = String(valor).replace(/"/g, '""');
      return `"${texto}"`;
    };

    const lineas: string[] = [];
    lineas.push(encabezados.map(escapar).join(separador));
    for (const fila of filas) {
      lineas.push(fila.map(escapar).join(separador));
    }

    // BOM UTF-8 (\uFEFF) para que Excel reconozca tildes y caracteres especiales
    const contenido = '\uFEFF' + lineas.join('\r\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `${nombreArchivo}_${fecha}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Genera una ventana de reporte profesional listo para imprimir o guardar como PDF
  exportarPDF(tituloReporte: string, subtitulo: string, encabezados: string[], filas: any[][], resumenTexto?: string): void {
    const config = this.ajustesService.obtenerAjustes();
    const fechaHora = new Date().toLocaleString('es-CO');
    const filasHtml = filas
      .map(
        (fila) =>
          `<tr>${fila
            .map((celda) => `<td>${celda !== null && celda !== undefined ? celda : ''}</td>`)
            .join('')}</tr>`
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${tituloReporte} - ${config.negocio.nombre}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #1a1d21; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #d62300; padding-bottom: 14px; margin-bottom: 20px; }
          .brand { font-size: 22px; font-weight: 800; color: #d62300; }
          .subtitle { font-size: 13px; color: #6c757d; margin-top: 4px; }
          .meta { text-align: right; font-size: 12px; color: #495057; line-height: 1.4; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12.5px; }
          th { background-color: #d62300; color: #ffffff; text-align: left; padding: 9px 10px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.4px; }
          td { padding: 8px 10px; border-bottom: 1px solid #e9ecef; }
          tr:nth-child(even) { background-color: #f8f9fa; }
          .summary { margin-top: 18px; padding: 12px 16px; background: #fff5f2; border-left: 4px solid #d62300; font-weight: 600; font-size: 13px; }
          .footer { margin-top: 28px; text-align: center; font-size: 11px; color: #868e96; border-top: 1px solid #dee2e6; padding-top: 10px; }
          @media print {
            .no-print { display: none; }
            body { margin: 12px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">${config.negocio.nombre} - ${tituloReporte}</div>
            <div class="subtitle">${subtitulo} | NIT: ${config.negocio.nit} | Tel: ${config.negocio.telefono}</div>
          </div>
          <div class="meta">
            <div><strong>Fecha de emisión:</strong> ${fechaHora}</div>
            <div><strong>Dirección:</strong> ${config.negocio.direccion}</div>
            <div><strong>Total registros:</strong> ${filas.length}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>${encabezados.map((h) => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${filasHtml || `<tr><td colspan="${encabezados.length}" style="text-align:center; padding: 20px;">Sin registros para mostrar</td></tr>`}
          </tbody>
        </table>
        ${resumenTexto ? `<div class="summary">${resumenTexto}</div>` : ''}
        <div class="footer">${config.negocio.mensajeRecibo} — Generado por ${config.negocio.nombre} OS</div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    const ventana = window.open('', '_blank', 'width=950,height=700');
    if (ventana) {
      ventana.document.open();
      ventana.document.write(html);
      ventana.document.close();
    }
  }

  // Genera e imprime un Ticket / Comanda POS en formato tirilla de 80mm
  imprimirTicketPOS(datos: {
    idPedido: number | string;
    cliente: string;
    fecha?: string;
    tipo: string;
    metodoPago: string;
    direccion?: string;
    estado?: string;
    total: number;
    productos?: Array<{ nombre: string; cantidad: number; precio: number; subtotal: number }>;
  }): void {
    const config = this.ajustesService.obtenerAjustes();
    const fechaTicket = datos.fecha || new Date().toLocaleString('es-CO');
    const totalBruto = Number(datos.total || 0);
    const porcImpuesto = Number(config.finanzas.impuestoPorcentaje || 8);
    const baseGravable = Math.round(totalBruto / (1 + porcImpuesto / 100));
    const valorImpuesto = totalBruto - baseGravable;

    const filasProductos =
      datos.productos && datos.productos.length > 0
        ? datos.productos
            .map(
              (item) => `
            <tr>
              <td style="padding: 4px 0;">${item.cantidad}x ${item.nombre}</td>
              <td style="text-align: right; padding: 4px 0;">$${Number(item.subtotal || item.cantidad * item.precio).toLocaleString('es-CO')}</td>
            </tr>`
            )
            .join('')
        : `
            <tr>
              <td style="padding: 4px 0;">1x Consumo General Pedido #${datos.idPedido}</td>
              <td style="text-align: right; padding: 4px 0;">$${totalBruto.toLocaleString('es-CO')}</td>
            </tr>`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Ticket POS #${datos.idPedido}</title>
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 300px;
            margin: 10px auto;
            color: #000;
            font-size: 12px;
            line-height: 1.35;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .totales td { padding: 2px 0; }
          .gran-total { font-size: 15px; font-weight: bold; }
          @media print {
            body { margin: 0; width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="bold" style="font-size: 16px; text-transform: uppercase;">${config.negocio.nombre}</div>
          <div>NIT: ${config.negocio.nit}</div>
          <div>${config.negocio.direccion}</div>
          <div>Tel: ${config.negocio.telefono}</div>
        </div>

        <div class="divider"></div>

        <div><strong>FACTURA / COMANDA:</strong> #FAC-${datos.idPedido}</div>
        <div><strong>FECHA:</strong> ${fechaTicket}</div>
        <div><strong>CLIENTE:</strong> ${datos.cliente}</div>
        <div><strong>SERVICIO:</strong> ${(datos.tipo || 'Local').toUpperCase()}</div>
        ${datos.direccion ? `<div><strong>DIRECCIÓN:</strong> ${datos.direccion}</div>` : ''}
        <div><strong>PAGO:</strong> ${datos.metodoPago || 'Efectivo'}</div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left; border-bottom: 1px solid #000; padding-bottom: 3px;">DESCRIPCIÓN</th>
              <th style="text-align: right; border-bottom: 1px solid #000; padding-bottom: 3px;">VALOR</th>
            </tr>
          </thead>
          <tbody>
            ${filasProductos}
          </tbody>
        </table>

        <div class="divider"></div>

        <table class="totales">
          <tr>
            <td>Subtotal Base:</td>
            <td style="text-align: right;">$${baseGravable.toLocaleString('es-CO')}</td>
          </tr>
          <tr>
            <td>Impoconsumo (${porcImpuesto}%):</td>
            <td style="text-align: right;">$${valorImpuesto.toLocaleString('es-CO')}</td>
          </tr>
          <tr class="gran-total">
            <td>TOTAL (${config.finanzas.moneda}):</td>
            <td style="text-align: right;">$${totalBruto.toLocaleString('es-CO')}</td>
          </tr>
        </table>

        <div class="divider"></div>

        <div class="center" style="margin-top: 8px;">
          <div>Tiempo estimado preparación: ~${config.negocio.tiempoEstimado} min</div>
          <div class="bold" style="margin-top: 6px;">${config.negocio.mensajeRecibo}</div>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    const ventana = window.open('', '_blank', 'width=400,height=620');
    if (ventana) {
      ventana.document.open();
      ventana.document.write(html);
      ventana.document.close();
    }
  }
}
