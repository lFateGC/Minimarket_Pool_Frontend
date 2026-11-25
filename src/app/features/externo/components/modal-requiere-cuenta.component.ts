import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../../core/services/carrito.service';

@Component({
  selector: 'app-modal-requiere-cuenta',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (carritoService.modalRequiereCuentaAbierto()) {
      <div class="modal-backdrop fade show" (click)="carritoService.cerrarRequiereCuenta()" style="z-index: 1065;"></div>

      <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 440px;">
          <div class="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
            <div class="modal-header border-0 bg-danger text-white py-3 px-4 position-relative">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-person-lock fs-4 text-warning"></i>
                <h6 class="modal-title fw-bold mb-0">Cuenta Requerida para Comprar</h6>
              </div>
              <button type="button" class="btn-close btn-close-white" (click)="carritoService.cerrarRequiereCuenta()" aria-label="Cerrar"></button>
            </div>

            <div class="modal-body p-4 text-center">
              <div class="mx-auto mb-3 d-flex align-items-center justify-content-center bg-danger-subtle text-danger rounded-circle shadow-sm"
                   style="width: 72px; height: 72px;">
                <i class="bi bi-bag-check-fill fs-1"></i>
              </div>

              <h5 class="fw-bold text-dark mb-2">¡Casi listo para completar tu compra!</h5>
              <p class="text-muted small mb-3">
                Puedes explorar nuestro catálogo libremente, pero para finalizar tu compra y coordinar la entrega o boleta SUNAT, necesitas contar con una cuenta registrada.
              </p>
              <div class="alert alert-light border small text-muted text-start mb-4 py-2">
                <i class="bi bi-info-circle-fill text-danger me-1"></i>
                Tus productos seguirán guardados en tu carrito para que pagues al instante al iniciar sesión o registrarte.
              </div>

              <div class="d-grid gap-2">
                <button class="btn btn-warning fw-bold text-dark py-2 shadow-sm" (click)="procederConAuth('registro')">
                  <i class="bi bi-person-plus-fill me-1"></i> Crear Cuenta Nueva con mi DNI
                </button>
                <button class="btn btn-outline-danger fw-semibold py-2" (click)="procederConAuth('login')">
                  <i class="bi bi-box-arrow-in-right me-1"></i> Ya tengo una cuenta (Iniciar Sesión)
                </button>
              </div>
            </div>

            <div class="bg-light px-4 py-2 text-center border-top">
              <small class="text-muted" style="font-size: 0.75rem;">
                <i class="bi bi-shield-check text-success me-1"></i> Tus compras y entregas están 100% garantizadas
              </small>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class ModalRequiereCuentaComponent {
  public carritoService = inject(CarritoService);
  @Output() abrirAuth = new EventEmitter<'login' | 'registro'>();

  procederConAuth(tab: 'login' | 'registro') {
    this.carritoService.cerrarRequiereCuenta();
    this.abrirAuth.emit(tab);
  }
}
