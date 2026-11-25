import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VentaResponse } from '../../core/models';
import { numeroALetrasSoles } from '../utils/numero-a-letras.util';

@Component({
  selector: 'app-boleta-sunat',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (venta) {
      <div class="boleta-formal-document p-3" id="boletaImprimibleFormal">
        <!-- 1. ENCABEZADO FISCAL -->
        <div class="row align-items-center mb-3">
          <div class="col-7">
            <div class="d-flex align-items-center gap-2 mb-1">
              <div class="brand-logo-boleta">
                <i class="bi bi-cart4 text-white fs-4"></i>
              </div>
              <div>
                <h5 class="fw-bold mb-0 text-danger" style="letter-spacing: -0.5px;">MINIMARKET POOL S.A.C.</h5>
                <small class="text-muted fw-semibold">"Tu ahorro es nuestra prioridad"</small>
              </div>
            </div>
            <div class="text-secondary small mt-1" style="font-size: 0.8rem; line-height: 1.35;">
              <div>Av. Los Rosales 1234, Lima - Perú</div>
              <div>Tel: (01) 234-5678 / WhatsApp: 987 654 321</div>
              <div>Email: ventas&#64;minimarketpool.com</div>
            </div>
          </div>

          <!-- RECUADRO SUNAT -->
          <div class="col-5">
            <div class="boleta-sunat-box text-center p-2">
              <div class="fw-bold small text-muted">R.U.C. 20608912345</div>
              <div class="fw-bold text-dark my-1" style="font-size: 0.95rem;">
                {{ venta.tipoComprobante || 'BOLETA DE VENTA ELECTRÓNICA' }}
              </div>
              <div class="fw-bold fs-6 text-danger">{{ serieCorrelativo() }}</div>
            </div>
          </div>
        </div>

        <!-- 2. DATOS DEL CLIENTE Y OPERACIÓN -->
        <div class="card border rounded-3 mb-3 bg-light p-2">
          <div class="row g-2 small">
            <div class="col-7">
              <span class="text-muted">Señor(a):</span>
              <strong class="text-dark d-block text-uppercase">{{ venta.clienteNombre || 'CLIENTE VARIOS / PÚBLICO GENERAL' }}</strong>
            </div>
            <div class="col-5">
              <span class="text-muted">Fecha de Emisión:</span>
              <strong class="text-dark d-block">{{ formatearFecha(venta.fecha) }}</strong>
            </div>
            <div class="col-7">
              <span class="text-muted">Documento:</span>
              <strong class="text-dark d-block">{{ venta.clienteNumeroDocumento || '00000000' }}</strong>
            </div>
            <div class="col-5">
              <span class="text-muted">Forma de Pago:</span>
              <span class="badge bg-warning text-dark fw-bold">{{ venta.metodoPago || 'EFECTIVO' }}</span>
            </div>
            <div class="col-12">
              <span class="text-muted">Dirección de Entrega:</span>
              <span class="text-dark fw-semibold d-block">{{ venta.direccionEnvio || venta.clienteDireccion || 'Entrega inmediata en tienda' }}</span>
            </div>
          </div>
        </div>

        <!-- 3. DETALLE DE ÍTEMS -->
        <div class="table-responsive mb-3">
          <table class="table table-bordered table-sm align-middle boleta-tabla-items mb-0">
            <thead class="table-light small">
              <tr>
                <th class="text-center" style="width: 45px;">Cant.</th>
                <th>Descripción del Producto</th>
                <th class="text-end" style="width: 100px;">P. Unit</th>
                <th class="text-end" style="width: 110px;">Total (S/)</th>
              </tr>
            </thead>
            <tbody class="small">
              @for (item of venta.detalles; track item.id || item.productoId) {
                <tr>
                  <td class="text-center fw-bold">{{ item.cantidad }}</td>
                  <td>{{ item.productoNombre }}</td>
                  <td class="text-end">S/ {{ item.precioUnitario | number:'1.2-2' }}</td>
                  <td class="text-end fw-semibold">S/ {{ item.subtotal | number:'1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- 4. TOTALES Y MONTO EN LETRAS -->
        <div class="row g-3 mb-3">
          <div class="col-7">
            <div class="p-2 border rounded-3 bg-light small mb-2">
              <div class="text-muted small fw-bold">SON:</div>
              <div class="fw-bold text-dark" style="font-size: 0.8rem;">{{ totalEnLetras() }}</div>
            </div>
            <div class="d-flex align-items-center gap-2 text-muted" style="font-size: 0.75rem;">
              <i class="bi bi-qr-code fs-3 text-dark"></i>
              <div>
                Código Hash SUNAT: <code>{{ hashVenta() }}</code><br>
                Representación impresa de la Boleta Electrónica.
              </div>
            </div>
          </div>

          <div class="col-5">
            <div class="p-2 border rounded-3 bg-light">
              <div class="d-flex justify-content-between small text-muted mb-1">
                <span>Op. Gravada:</span>
                <span class="text-dark fw-semibold">S/ {{ opGravada() | number:'1.2-2' }}</span>
              </div>
              <div class="d-flex justify-content-between small text-muted mb-1">
                <span>I.G.V. (18%):</span>
                <span class="text-dark fw-semibold">S/ {{ igv() | number:'1.2-2' }}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center border-top pt-2">
                <span class="fw-bold fs-6 text-dark">TOTAL:</span>
                <span class="fs-5 fw-bold text-danger">S/ {{ venta.total | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center pt-2 border-top text-muted small" style="font-size: 0.75rem;">
          ¡Muchas gracias por su compra! Minimarket Pool les desea un excelente día.
        </div>
      </div>
    }
  `,
  styles: [`
    .boleta-formal-document {
      background: #ffffff;
      color: #1e293b;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .brand-logo-boleta {
      width: 44px;
      height: 44px;
      background: #dc2626;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .boleta-sunat-box {
      border: 2px solid #0f172a;
      border-radius: 8px;
      background: #ffffff;
    }
    .boleta-tabla-items th, .boleta-tabla-items td {
      border: 1px solid #cbd5e1;
    }
  `]
})
export class BoletaSunatComponent {
  @Input() venta: VentaResponse | null = null;

  serieCorrelativo = computed(() => {
    if (!this.venta) return 'B001-00000001';
    if (this.venta.numeroComprobante) return this.venta.numeroComprobante;
    const pad = (this.venta.id || 1).toString().padStart(8, '0');
    return `B001-${pad}`;
  });

  opGravada = computed(() => {
    if (!this.venta) return 0;
    return this.venta.subtotal || (this.venta.total / 1.18);
  });

  igv = computed(() => {
    if (!this.venta) return 0;
    return this.venta.igv || (this.venta.total - this.opGravada());
  });

  totalEnLetras = computed(() => {
    if (!this.venta) return '';
    return numeroALetrasSoles(this.venta.total);
  });

  hashVenta = computed(() => {
    const id = this.venta?.id || 1;
    return `qWeR+${id}TyU8${id * 7}vNxZ==`;
  });

  formatearFecha(f: string): string {
    if (!f) return new Date().toLocaleDateString('es-PE');
    return f.replace('T', ' ').substring(0, 16);
  }

  imprimir() {
    const el = document.getElementById('boletaImprimibleFormal');
    if (!el) {
      window.print();
      return;
    }

    const ventana = window.open('', '_blank', 'width=840,height=900');
    if (!ventana) return;

    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Boleta de Venta Electrónica - Minimarket Pool</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
        <style>
          body {
            background: #ffffff !important;
            font-family: system-ui, -apple-system, sans-serif;
            color: #0f172a;
            padding: 24px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .brand-logo-boleta {
            width: 44px; height: 44px;
            background: #dc2626 !important;
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
          }
          .boleta-sunat-box {
            border: 2px solid #0f172a !important;
            border-radius: 8px;
            background: #ffffff !important;
          }
          .table-bordered th, .table-bordered td {
            border: 1px solid #cbd5e1 !important;
          }
          .table th {
            background-color: #f1f5f9 !important;
            color: #334155 !important;
            font-weight: 700;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
        </style>
      </head>
      <body>
        ${el.outerHTML}
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 800);
          };
        <\/script>
      </body>
      </html>
    `);
    ventana.document.close();
  }
}
