import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../../core/services/carrito.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-cart-offcanvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (carritoService.offcanvasAbierto()) {
      <!-- Backdrop Oscuro Detrás del Carrito -->
      <div class="cart-backdrop fade show" (click)="carritoService.cerrarOffcanvas()"></div>

      <!-- Offcanvas Flotante Frontal -->
      <div class="offcanvas offcanvas-end show cart-offcanvas-panel" tabindex="-1" style="visibility: visible;">
        <div class="offcanvas-header bg-danger text-white py-3">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-cart3 fs-4 text-warning"></i>
            <h5 class="offcanvas-title fw-bold mb-0">Mi Carrito de Compras</h5>
          </div>
          <button type="button" class="btn-close btn-close-white" (click)="carritoService.cerrarOffcanvas()" aria-label="Close"></button>
        </div>

        <div class="offcanvas-body p-3 d-flex flex-column">
          @if (carritoService.items().length === 0) {
            <div class="text-center my-auto py-5 text-muted">
              <i class="bi bi-cart-x fs-1 d-block mb-3 text-secondary"></i>
              <h5 class="fw-bold">Tu carrito está vacío</h5>
              <p class="small text-muted mb-4">Descubre nuestros productos y ahorra en tus compras diarias.</p>
              <button class="btn btn-outline-danger fw-semibold px-4" (click)="carritoService.cerrarOffcanvas()">
                Explorar Catálogo
              </button>
            </div>
          } @else {
            <!-- Lista de Ítems -->
            <div class="flex-grow-1 overflow-auto pe-1">
              @for (item of carritoService.items(); track item.producto.id) {
                <div class="cart-item-row d-flex align-items-center gap-2 py-2 border-bottom">
                  <img [src]="item.producto.imagenUrl || 'https://placehold.co/100x100/f8fafc/94a3b8?text=Pool'"
                       [alt]="item.producto.nombre" class="cart-item-img"
                       onerror="this.src='https://placehold.co/100x100/f8fafc/94a3b8?text=Pool'">

                  <div class="flex-grow-1 min-w-0">
                    <div class="fw-bold small text-dark text-truncate" [title]="item.producto.nombre">
                      {{ item.producto.nombre }}
                    </div>
                    <div class="text-muted small">
                      S/ {{ item.producto.precioUnitario | number:'1.2-2' }} c/u
                    </div>

                    <!-- Stepper -->
                    <div class="d-flex align-items-center gap-2 mt-1">
                      <div class="cart-stepper">
                        <button type="button" (click)="carritoService.cambiarCantidad(item.producto.id, -1)">-</button>
                        <span>{{ item.cantidad }}</span>
                        <button type="button" (click)="carritoService.cambiarCantidad(item.producto.id, 1)">+</button>
                      </div>
                      <span class="fw-bold text-danger small">
                        S/ {{ (item.producto.precioUnitario * item.cantidad) | number:'1.2-2' }}
                      </span>
                    </div>
                  </div>

                  <button class="btn btn-link text-danger p-1" title="Eliminar del carrito"
                          (click)="carritoService.eliminar(item.producto.id)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              }
            </div>

            <!-- Resumen y Checkout -->
            <div class="border-top pt-3 mt-auto bg-light rounded-3 p-3">
              <div class="d-flex justify-content-between small text-muted mb-1">
                <span>Subtotal:</span>
                <span class="text-dark fw-semibold">S/ {{ (carritoService.subtotal() / 1.18) | number:'1.2-2' }}</span>
              </div>
              <div class="d-flex justify-content-between small text-muted mb-2">
                <span>I.G.V. (18%):</span>
                <span class="text-dark fw-semibold">S/ {{ (carritoService.subtotal() - (carritoService.subtotal() / 1.18)) | number:'1.2-2' }}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center border-top pt-2 mb-3">
                <span class="fw-bold fs-6 text-dark">Total a Pagar:</span>
                <span class="fs-4 fw-bold text-danger">S/ {{ carritoService.total() | number:'1.2-2' }}</span>
              </div>

              <button class="btn btn-danger w-100 py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                      (click)="iniciarCompra()">
                <i class="bi bi-bag-check-fill"></i> Proceder al Pago
              </button>

              <button class="btn btn-link btn-sm text-muted w-100 mt-2 text-decoration-none"
                      (click)="carritoService.vaciar()">
                <i class="bi bi-trash-fill me-1"></i> Vaciar Carrito
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .cart-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(2px);
      z-index: 1050;
    }
    .cart-offcanvas-panel {
      z-index: 1060 !important;
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.25) !important;
      max-width: 420px;
      width: 100%;
    }
    @media (max-width: 575.98px) {
      .cart-offcanvas-panel {
        max-width: 100vw !important;
        width: 100vw !important;
      }
    }
    .cart-item-img {
      width: 52px;
      height: 52px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      flex-shrink: 0;
    }
    .cart-stepper {
      display: inline-flex;
      align-items: center;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
    }
    .cart-stepper button {
      background: none;
      border: none;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      cursor: pointer;
      color: #334155;
    }
    .cart-stepper button:hover {
      background: #f1f5f9;
    }
    .cart-stepper span {
      width: 28px;
      text-align: center;
      font-weight: 700;
      font-size: 0.85rem;
    }
  `]
})
export class CartOffcanvasComponent {
  public carritoService = inject(CarritoService);
  private authService = inject(AuthService);

  @Output() abrirLogin = new EventEmitter<'login' | 'registro'>();

  iniciarCompra() {
    this.carritoService.cerrarOffcanvas();
    if (!this.authService.isLoggedIn()) {
      this.carritoService.marcarCompraPendiente(true);
      this.carritoService.solicitarCuentaParaComprar(null);
      return;
    }
    this.carritoService.abrirCheckout();
  }
}
