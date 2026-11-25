import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarritoService } from '../../../core/services/carrito.service';
import { VentaService } from '../../../core/services/venta.service';
import { ToastService } from '../../../core/services/toast.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { DetalleVentaRequest, VentaRequest, VentaResponse } from '../../../core/models';

@Component({
  selector: 'app-modal-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (carritoService.modalCheckoutAbierto()) {
      <div class="modal-backdrop fade show" (click)="carritoService.cerrarCheckout()" style="z-index: 1065;"></div>

      <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content rounded-4 border-0 shadow-lg">
            <div class="modal-header bg-danger text-white rounded-top-4">
              <h5 class="modal-title fw-bold">
                <i class="bi bi-shield-lock-fill me-2 text-warning"></i> Confirmar Pedido y Datos de Entrega
              </h5>
              <button type="button" class="btn-close btn-close-white" (click)="carritoService.cerrarCheckout()" aria-label="Cerrar"></button>
            </div>

            <form (ngSubmit)="confirmarPedido()">
              <div class="modal-body p-4">
                <div class="row g-3">
                  <!-- Resumen de Pedido -->
                  <div class="col-12">
                    <div class="p-3 bg-light rounded-3 border">
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <strong class="text-dark">Resumen de Productos ({{ carritoService.totalItems() }} unidades)</strong>
                        <span class="badge bg-danger">{{ carritoService.items().length }} productos</span>
                      </div>
                      <div class="small text-muted" style="max-height: 120px; overflow-y: auto;">
                        @for (it of carritoService.items(); track it.producto.id) {
                          <div class="d-flex justify-content-between py-1 border-bottom">
                            <span>{{ it.cantidad }}x {{ it.producto.nombre }}</span>
                            <span class="fw-semibold">S/ {{ (it.producto.precioUnitario * it.cantidad) | number:'1.2-2' }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  </div>

                  <!-- Método de Pago -->
                  <div class="col-md-6">
                    <label class="form-label small fw-bold text-muted">Método de Pago *</label>
                    <select class="form-select" [(ngModel)]="metodoPago" name="metodoPago" required>
                      <option value="EFECTIVO">💵 Efectivo contra entrega</option>
                      <option value="YAPE">📱 Yape (Pago móvil)</option>
                      <option value="PLIN">📱 Plin (Pago móvil)</option>
                      <option value="TARJETA">💳 Tarjeta Débito / Crédito</option>
                    </select>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label small fw-bold text-muted">Teléfono de Contacto *</label>
                    <input type="tel" class="form-control" [(ngModel)]="telefonoContacto" name="telefonoContacto"
                           placeholder="987654321" required>
                  </div>

                  <!-- Dirección de Entrega -->
                  <div class="col-12">
                    <label class="form-label small fw-bold text-muted">Dirección de Entrega a Domicilio *</label>
                    <input type="text" class="form-control" [(ngModel)]="direccionEnvio" name="direccionEnvio"
                           placeholder="Av. / Calle, Número, Piso o Dpto, Referencia" required>
                  </div>

                  <!-- Instrucciones Dinámicas según Método de Pago -->
                  <div class="col-12">
                    @if (metodoPago === 'YAPE' || metodoPago === 'PLIN') {
                      <div class="p-3 rounded-3 bg-warning-subtle border border-warning-subtle small text-dark d-flex align-items-center gap-3">
                        <i class="bi bi-qr-code fs-1 text-dark"></i>
                        <div>
                          <strong class="d-block">Escanea o transfiere vía {{ metodoPago }}:</strong>
                          <span>Número Oficial: <code class="fw-bold fs-6">987 654 321</code> (Minimarket Pool SAC)</span><br>
                          <small class="text-muted">El repartidor verificará la captura del pago al momento de entregar tu pedido.</small>
                        </div>
                      </div>
                    } @else if (metodoPago === 'EFECTIVO') {
                      <div class="p-3 rounded-3 bg-light border small text-dark">
                        <label class="form-label small fw-bold mb-1">¿Con cuánto efectivo pagarás? (Para llevarte el vuelto exacto):</label>
                        <div class="input-group input-group-sm" style="max-width: 250px;">
                          <span class="input-group-text">S/</span>
                          <input type="number" step="0.5" class="form-control" [(ngModel)]="montoPagaCon" name="montoPagaCon"
                                 [min]="carritoService.total()" placeholder="Monto en efectivo">
                        </div>
                        @if (montoPagaCon > carritoService.total()) {
                          <div class="text-success fw-bold mt-2">
                            <i class="bi bi-cash-coin me-1"></i> Vuelto estimado: S/ {{ (montoPagaCon - carritoService.total()) | number:'1.2-2' }}
                          </div>
                        }
                      </div>
                    } @else {
                      <div class="p-3 rounded-3 bg-light border small text-muted">
                        <i class="bi bi-credit-card me-1 text-primary"></i> El repartidor llevará el POS inalámbrico para que pagues de forma segura con tarjeta Visa, Mastercard o American Express.
                      </div>
                    }
                  </div>

                  <!-- Monto Total -->
                  <div class="col-12">
                    <div class="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center border">
                      <div>
                        <span class="text-muted small d-block">Monto Total a Cancelar:</span>
                        <strong class="fs-4 text-danger">S/ {{ carritoService.total() | number:'1.2-2' }}</strong>
                      </div>
                      <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
                        <i class="bi bi-shield-check me-1"></i> Pedido 100% Garantizado
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal-footer bg-light border-0 rounded-bottom-4">
                <button type="button" class="btn btn-secondary" (click)="carritoService.cerrarCheckout()">Regresar</button>
                <button type="submit" class="btn btn-danger fw-bold px-4 py-2 shadow-sm" [disabled]="procesando">
                  @if (procesando) {
                    <span class="spinner-border spinner-border-sm me-2"></span> Procesando Pedido...
                  } @else {
                    <i class="bi bi-bag-check-fill me-2"></i> Confirmar y Realizar Pedido
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class ModalCheckoutComponent {
  public carritoService = inject(CarritoService);
  private ventaService = inject(VentaService);
  private clienteService = inject(ClienteService);
  private toastService = inject(ToastService);

  @Output() pedidoConfirmado = new EventEmitter<VentaResponse>();

  metodoPago: 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA' = 'EFECTIVO';
  telefonoContacto = '';
  direccionEnvio = '';
  montoPagaCon = 0;
  procesando = false;

  constructor() {
    // Intentar precargar teléfono y dirección del perfil del cliente
    this.clienteService.obtenerMiPerfil().subscribe({
      next: p => {
        if (p.telefono && !this.telefonoContacto) this.telefonoContacto = p.telefono;
        if (p.direccion && !this.direccionEnvio) this.direccionEnvio = p.direccion;
      },
      error: () => {}
    });
  }

  confirmarPedido() {
    if (this.carritoService.items().length === 0) {
      this.toastService.warning('Carrito Vacío', 'No hay productos en el carrito para procesar.');
      return;
    }

    if (!this.direccionEnvio.trim()) {
      this.toastService.warning('Dirección Requerida', 'Por favor ingresa la dirección de entrega.');
      return;
    }

    const detalles: DetalleVentaRequest[] = this.carritoService.items().map(it => ({
      productoId: it.producto.id,
      cantidad: it.cantidad,
      precioUnitario: it.producto.precioUnitario
    }));

    const total = this.carritoService.total();
    const vuelto = (this.metodoPago === 'EFECTIVO' && this.montoPagaCon > total)
      ? this.montoPagaCon - total
      : 0;

    const request: VentaRequest = {
      tipoComprobante: 'BOLETA',
      metodoPago: this.metodoPago,
      montoEfectivo: this.metodoPago === 'EFECTIVO' ? (this.montoPagaCon || total) : total,
      vuelto,
      direccionEnvio: `${this.direccionEnvio.trim()} (Telf: ${this.telefonoContacto.trim()})`,
      items: detalles,
      detalles
    };

    this.procesando = true;
    this.ventaService.registrarCompraCliente(request).subscribe({
      next: res => {
        this.procesando = false;
        this.carritoService.vaciar();
        this.carritoService.cerrarCheckout();
        this.toastService.success('¡Compra Exitosa!', `Tu pedido #${res.id} ha sido registrado correctamente.`);
        this.pedidoConfirmado.emit(res);
      },
      error: err => {
        this.procesando = false;
        this.toastService.error('Error al Comprar', err.error?.mensaje || 'No se pudo procesar tu pedido.');
      }
    });
  }
}
