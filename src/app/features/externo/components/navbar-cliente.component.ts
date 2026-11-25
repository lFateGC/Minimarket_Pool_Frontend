import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CarritoService } from '../../../core/services/carrito.service';
import { ToastService } from '../../../core/services/toast.service';
import { Categoria } from '../../../core/models';

@Component({
  selector: 'app-navbar-cliente',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Barra Superior de Promociones -->
    <div class="top-ticker">
      <i class="bi bi-tag-fill me-1"></i> ¡ENVÍOS GRATIS POR COMPRAS MAYORES A S/ 50 EN TODO EL DISTRITO! &nbsp;|&nbsp;
      <i class="bi bi-clock-fill me-1"></i> HORARIO: LUN - DOM 7:00 AM - 11:00 PM
    </div>

    <!-- Navegación Principal -->
    <header class="navbar-cliente py-2 px-2 px-md-3">
      <div class="container-fluid d-flex align-items-center justify-content-between flex-wrap">
        <!-- Logo y Nombre -->
        <a routerLink="/tienda" class="text-decoration-none d-flex align-items-center gap-2 text-white">
          <div class="brand-logo-badge">
            <i class="bi bi-cart4 text-dark fs-4"></i>
          </div>
          <div>
            <span class="brand-name">MINIMARKET POOL</span>
            <small class="brand-slogan d-none d-sm-block">"Tu ahorro es nuestra prioridad"</small>
          </div>
        </a>

        <!-- Buscador Central (En móviles baja a su propia fila completa) -->
        <div class="search-input-box order-3 order-md-2 mt-2 mt-md-0 mx-auto">
          <i class="bi bi-search text-muted me-2"></i>
          <input type="text" placeholder="Buscar productos, marcas o SKU..."
                 (input)="alBuscar($event)">
        </div>

        <!-- Acciones: Carrito, Sesión / Hamburguesa en Pantallas Angostas -->
        <div class="d-flex align-items-center gap-2 order-2 order-md-3">
          <!-- Carrito de Compras Siempre Visible -->
          <button class="btn btn-warning position-relative fw-bold text-dark rounded-pill px-3 py-2 shadow-sm d-flex align-items-center gap-2"
                  (click)="clickCarrito()">
            <i class="bi bi-cart3 fs-5"></i>
            <span class="d-none d-sm-inline">Carrito</span>
            <span class="badge bg-danger text-white rounded-pill ms-1">{{ carritoService.totalItems() }}</span>
          </button>

          <!-- Autenticación Cliente (VISIBLE EN PANTALLAS MEDIANAS Y GRANDES md+) -->
          @if (authService.isLoggedIn()) {
            <div class="dropdown d-none d-md-block">
              <button class="btn btn-outline-light rounded-pill dropdown-toggle d-flex align-items-center gap-2 py-2 px-3"
                      type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-person-circle fs-5"></i>
                <span class="fw-semibold text-truncate" style="max-width: 140px;">
                  {{ authService.currentUser()?.nombre }}
                </span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-2">
                <li class="px-3 py-2 border-bottom">
                  <div class="fw-bold text-dark">{{ authService.currentUser()?.nombre }}</div>
                  <small class="text-muted">{{ authService.currentUser()?.email }}</small>
                </li>
                <li>
                  <a class="dropdown-item py-2 fw-semibold" routerLink="/tienda/mi-cuenta" [queryParams]="{ tab: 'pedidos' }">
                    <i class="bi bi-bag-check-fill me-2 text-danger"></i> Mis Pedidos y Compras
                  </a>
                </li>
                <li>
                  <a class="dropdown-item py-2 fw-semibold" routerLink="/tienda/mi-cuenta" [queryParams]="{ tab: 'perfil' }">
                    <i class="bi bi-person-gear me-2 text-primary"></i> Mi Perfil y Facturación
                  </a>
                </li>
                @if (authService.isPersonal()) {
                  <li><hr class="dropdown-divider"></li>
                  <li>
                    <a class="dropdown-item py-2 text-primary fw-bold" routerLink="/interno/dashboard">
                      <i class="bi bi-speedometer2 me-2"></i> Ir al Panel Interno
                    </a>
                  </li>
                }
                <li><hr class="dropdown-divider"></li>
                <li>
                  <a class="dropdown-item py-2 text-danger" href="javascript:void(0)" (click)="authService.logout('/tienda')">
                    <i class="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                  </a>
                </li>
              </ul>
            </div>
          } @else {
            <button class="btn btn-outline-light rounded-pill px-3 py-2 fw-semibold d-none d-md-flex align-items-center gap-1"
                    (click)="abrirLogin.emit('login')">
              <i class="bi bi-person fs-5"></i>
              <span>Ingresar</span>
            </button>
            <button class="btn btn-light rounded-pill px-3 py-2 fw-bold text-danger d-none d-md-inline"
                    (click)="abrirLogin.emit('registro')">
              Registrarme
            </button>
          }

          <!-- Botón de Acceso Personal Interno (VISIBLE EN md+) -->
          <a routerLink="/interno/login" class="btn btn-outline-warning rounded-pill px-2 py-2 text-white border-warning-subtle d-none d-md-inline-flex"
             title="Acceso exclusivo para Personal de Tienda (Cajero / Admin)">
            <i class="bi bi-shield-lock-fill"></i>
          </a>

          <!-- BOTÓN HAMBURGUESA PARA PANTALLAS ANGOSTAS (< md) -->
          <button class="btn btn-outline-light rounded-pill px-3 py-2 d-md-none d-flex align-items-center gap-1 shadow-sm"
                  type="button"
                  (click)="menuMovilAbierto = !menuMovilAbierto"
                  title="Menú y Opciones">
            <i class="bi" [ngClass]="menuMovilAbierto ? 'bi-x-lg fs-5' : 'bi-list fs-4'"></i>
          </button>
        </div>
      </div>
    </header>

    <!-- DRAWER / MENÚ MÓVIL CON ACORDEONES -->
    @if (menuMovilAbierto) {
      <!-- Backdrop Oscuro -->
      <div class="menu-movil-backdrop fade show" (click)="menuMovilAbierto = false"></div>

      <!-- Panel Desplegable Acordeón -->
      <div class="menu-movil-drawer shadow-lg d-flex flex-column" tabindex="-1">
        <!-- Cabecera del Cajón -->
        <div class="p-3 bg-danger text-white d-flex align-items-center justify-content-between border-bottom">
          <div class="d-flex align-items-center gap-2">
            <div class="brand-logo-badge" style="width: 34px; height: 34px;">
              <i class="bi bi-cart4 text-dark fs-5"></i>
            </div>
            <div>
              <strong class="d-block text-white fs-6">MINIMARKET POOL</strong>
              <small class="text-warning" style="font-size: 0.72rem;">Menú y Categorías</small>
            </div>
          </div>
          <button type="button" class="btn btn-link text-white p-1" (click)="menuMovilAbierto = false">
            <i class="bi bi-x-lg fs-5"></i>
          </button>
        </div>

        <!-- Cuerpo del Menú con Acordeones -->
        <div class="p-3 flex-grow-1 overflow-auto bg-light">
          <div class="accordion shadow-sm rounded-4 overflow-hidden" id="acordeonMenuMovil">

            <!-- 1. ACORDEÓN: MI CUENTA / SESIÓN -->
            <div class="accordion-item border-0 border-bottom">
              <h2 class="accordion-header" id="headingCuenta">
                <button class="accordion-button fw-bold text-dark py-3" type="button"
                        [class.collapsed]="!acordeonCuentaAbierto"
                        (click)="acordeonCuentaAbierto = !acordeonCuentaAbierto">
                  <i class="bi bi-person-circle fs-5 text-danger me-2"></i>
                  @if (authService.isLoggedIn()) {
                    <span>Mi Cuenta: {{ authService.currentUser()?.nombre }}</span>
                  } @else {
                    <span>Acceso de Clientes</span>
                  }
                </button>
              </h2>
              <div class="accordion-collapse collapse" [class.show]="acordeonCuentaAbierto">
                <div class="accordion-body bg-white p-3">
                  @if (authService.isLoggedIn()) {
                    <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                      <div class="avatar-movil bg-danger text-white fw-bold">
                        {{ authService.currentUser()?.nombre?.substring(0, 1) || 'U' }}
                      </div>
                      <div class="min-w-0">
                        <strong class="text-dark d-block text-truncate">{{ authService.currentUser()?.nombre }}</strong>
                        <small class="text-muted d-block text-truncate">{{ authService.currentUser()?.email }}</small>
                      </div>
                    </div>

                    <div class="d-grid gap-2">
                      <a routerLink="/tienda/mi-cuenta" [queryParams]="{ tab: 'pedidos' }"
                         class="btn btn-outline-danger fw-semibold text-start py-2"
                         (click)="menuMovilAbierto = false">
                        <i class="bi bi-bag-check-fill me-2 text-danger"></i> Mis Pedidos y Compras
                      </a>
                      <a routerLink="/tienda/mi-cuenta" [queryParams]="{ tab: 'perfil' }"
                         class="btn btn-outline-secondary fw-semibold text-start py-2"
                         (click)="menuMovilAbierto = false">
                        <i class="bi bi-person-gear me-2 text-primary"></i> Mi Perfil y Facturación
                      </a>
                      @if (authService.isPersonal()) {
                        <a routerLink="/interno/dashboard"
                           class="btn btn-warning fw-bold text-dark text-start py-2"
                           (click)="menuMovilAbierto = false">
                          <i class="bi bi-speedometer2 me-2"></i> Panel Interno
                        </a>
                      }
                      <button class="btn btn-link text-danger text-start p-1 mt-1 text-decoration-none"
                              (click)="authService.logout('/tienda'); menuMovilAbierto = false">
                        <i class="bi bi-box-arrow-right me-1"></i> Cerrar Sesión
                      </button>
                    </div>
                  } @else {
                    <p class="small text-muted mb-3">
                      Inicia sesión para gestionar tus pedidos y agilizar tus compras con delivery.
                    </p>
                    <div class="d-grid gap-2">
                      <button class="btn btn-danger fw-bold py-2 shadow-sm"
                              (click)="abrirLogin.emit('login'); menuMovilAbierto = false">
                        <i class="bi bi-box-arrow-in-right me-1"></i> Iniciar Sesión
                      </button>
                      <button class="btn btn-warning fw-bold text-dark py-2 shadow-sm"
                              (click)="abrirLogin.emit('registro'); menuMovilAbierto = false">
                        <i class="bi bi-person-plus-fill me-1"></i> Crear Cuenta con DNI
                      </button>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- 2. ACORDEÓN: CATEGORÍAS DEL CATÁLOGO -->
            <div class="accordion-item border-0 border-bottom">
              <h2 class="accordion-header" id="headingCategorias">
                <button class="accordion-button fw-bold text-dark py-3" type="button"
                        [class.collapsed]="!acordeonCategoriasAbierto"
                        (click)="acordeonCategoriasAbierto = !acordeonCategoriasAbierto">
                  <i class="bi bi-tags-fill fs-5 text-warning me-2"></i>
                  <span>Explorar Categorías</span>
                </button>
              </h2>
              <div class="accordion-collapse collapse" [class.show]="acordeonCategoriasAbierto">
                <div class="accordion-body bg-white p-2">
                  <div class="list-group list-group-flush">
                    <button type="button"
                            class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 border-0 rounded-2 fw-semibold"
                            (click)="clickCategoria('')">
                      <span><i class="bi bi-grid-fill me-2 text-danger"></i> Todas las Categorías</span>
                      <i class="bi bi-chevron-right small text-muted"></i>
                    </button>
                    @for (cat of categorias; track cat.id) {
                      <button type="button"
                              class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 border-0 rounded-2 small"
                              (click)="clickCategoria(cat.nombre)">
                        <span><i class="bi bi-tag me-2 text-secondary"></i> {{ cat.nombre }}</span>
                        <i class="bi bi-chevron-right small text-muted"></i>
                      </button>
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. ACORDEÓN: PORTAL INTERNO PERSONAL -->
            <div class="accordion-item border-0 border-bottom">
              <h2 class="accordion-header" id="headingInterno">
                <button class="accordion-button fw-bold text-dark py-3" type="button"
                        [class.collapsed]="!acordeonInternoAbierto"
                        (click)="acordeonInternoAbierto = !acordeonInternoAbierto">
                  <i class="bi bi-shield-lock-fill fs-5 text-danger me-2"></i>
                  <span>Portal Interno de Tienda</span>
                </button>
              </h2>
              <div class="accordion-collapse collapse" [class.show]="acordeonInternoAbierto">
                <div class="accordion-body bg-white p-3">
                  <p class="small text-muted mb-3">
                    Acceso exclusivo para cajeros, vendedores y administradores de Minimarket Pool.
                  </p>
                  <a routerLink="/interno/login"
                     class="btn btn-outline-danger fw-bold w-100 py-2"
                     (click)="menuMovilAbierto = false">
                    <i class="bi bi-cart-check-fill me-1 text-warning"></i> Ingresar a POS y Caja
                  </a>
                </div>
              </div>
            </div>

            <!-- 4. ACORDEÓN: ATENCIÓN Y CONTACTO -->
            <div class="accordion-item border-0">
              <h2 class="accordion-header" id="headingContacto">
                <button class="accordion-button fw-bold text-dark py-3" type="button"
                        [class.collapsed]="!acordeonContactoAbierto"
                        (click)="acordeonContactoAbierto = !acordeonContactoAbierto">
                  <i class="bi bi-headset fs-5 text-success me-2"></i>
                  <span>Atención al Cliente & Delivery</span>
                </button>
              </h2>
              <div class="accordion-collapse collapse" [class.show]="acordeonContactoAbierto">
                <div class="accordion-body bg-white p-3 small text-muted">
                  <div class="mb-2">
                    <i class="bi bi-geo-alt-fill text-danger me-1"></i> Av. Los Rosales 1234, Lima - Perú
                  </div>
                  <div class="mb-2">
                    <i class="bi bi-whatsapp text-success me-1"></i> WhatsApp Pedidos: <strong>987 654 321</strong>
                  </div>
                  <div>
                    <i class="bi bi-clock-fill text-warning me-1"></i> Horario: Lunes a Domingo 7:00 AM - 11:00 PM
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Footer del Menú -->
        <div class="p-3 bg-white border-top text-center small text-muted">
          <small>MINIMARKET POOL S.A.C. &bull; "Tu ahorro es nuestra prioridad"</small>
        </div>
      </div>
    }
  `,
  styles: [`
    .top-ticker {
      background: #111827;
      color: #fbbf24;
      font-size: 0.78rem;
      padding: 5px 0;
      font-weight: 600;
      text-align: center;
    }
    .navbar-cliente {
      background: var(--pool-rojo, #dc2626);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
      position: sticky;
      top: 0;
      z-index: 1030;
    }
    .brand-logo-badge {
      width: 40px;
      height: 40px;
      background: #fbbf24;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      flex-shrink: 0;
    }
    .brand-name {
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: -0.01em;
      display: block;
      line-height: 1.1;
    }
    .brand-slogan {
      font-size: 0.72rem;
      color: #fbbf24;
      font-style: italic;
      display: block;
    }
    .search-input-box {
      background: #ffffff;
      border-radius: 999px;
      padding: 6px 16px;
      display: flex;
      align-items: center;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      transition: all 0.2s ease;
    }
    @media (max-width: 767.98px) {
      .search-input-box {
        max-width: 100% !important;
      }
    }
    .search-input-box input {
      border: none;
      outline: none;
      width: 100%;
      font-size: 0.88rem;
    }
    .avatar-movil {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    /* Estilos del Menú Cajón Móvil / Acordeón */
    .menu-movil-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(2px);
      z-index: 1040;
    }
    .menu-movil-drawer {
      position: fixed;
      top: 0;
      right: 0;
      width: 320px;
      max-width: 85vw;
      height: 100vh;
      background-color: #ffffff;
      z-index: 1045;
      animation: slideInRight 0.25s ease-out;
    }
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }
  `]
})
export class NavbarClienteComponent {
  public authService = inject(AuthService);
  public carritoService = inject(CarritoService);
  private toastService = inject(ToastService);

  @Input() categorias: Categoria[] = [];

  @Output() buscar = new EventEmitter<string>();
  @Output() abrirLogin = new EventEmitter<'login' | 'registro'>();
  @Output() abrirMisCompras = new EventEmitter<void>();
  @Output() abrirMiPerfil = new EventEmitter<void>();
  @Output() seleccionarCategoria = new EventEmitter<string>();

  menuMovilAbierto = false;
  acordeonCuentaAbierto = true;
  acordeonCategoriasAbierto = false;
  acordeonInternoAbierto = false;
  acordeonContactoAbierto = false;

  clickCarrito() {
    if (!this.authService.isLoggedIn()) {
      this.toastService.warning('Acceso Requerido', 'Para usar el carrito de compras es necesario iniciar sesión o registrarse.');
      this.abrirLogin.emit('login');
      return;
    }
    this.carritoService.abrirOffcanvas();
  }

  alBuscar(e: Event) {
    const valor = (e.target as HTMLInputElement).value;
    this.buscar.emit(valor);
  }

  clickCategoria(catNombre: string) {
    this.seleccionarCategoria.emit(catNombre);
    this.menuMovilAbierto = false;
  }
}
