import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { NavbarClienteComponent } from '../components/navbar-cliente.component';
import { CartOffcanvasComponent } from '../components/cart-offcanvas.component';
import { ModalAuthComponent } from '../components/modal-auth.component';
import { ModalRequiereCuentaComponent } from '../components/modal-requiere-cuenta.component';
import { ModalCheckoutComponent } from '../components/modal-checkout.component';
import { BoletaSunatComponent } from '../../../shared/components/boleta-sunat.component';
import { ProductoService } from '../../../core/services/producto.service';
import { AuthService } from '../../../core/services/auth.service';
import { CarritoService } from '../../../core/services/carrito.service';
import { VentaService } from '../../../core/services/venta.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { ToastService } from '../../../core/services/toast.service';
import { Categoria, Cliente, Producto, VentaResponse } from '../../../core/models';

@Component({
  selector: 'app-tienda-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NavbarClienteComponent,
    CartOffcanvasComponent,
    ModalAuthComponent,
    ModalRequiereCuentaComponent,
    ModalCheckoutComponent,
    BoletaSunatComponent
  ],
  template: `
    <!-- Barra y Cabecera de Tienda -->
    <app-navbar-cliente
      [categorias]="categorias()"
      (buscar)="alBuscarTexto($event)"
      (seleccionarCategoria)="seleccionarCategoria($event)"
      (abrirLogin)="abrirModalAuth($event)"
      (abrirMisCompras)="abrirModalHistorial()"
      (abrirMiPerfil)="abrirModalPerfil()">
    </app-navbar-cliente>

    <main class="tienda-main-content">
      <!-- HERO BANNER -->
      <section class="hero-cliente py-5">
        <div class="container">
          <div class="row align-items-center g-4">
            <div class="col-lg-7">
              <span class="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold mb-3 shadow-sm">
                <i class="bi bi-stars me-1"></i> Precios de Bodega Directo a tu Hogar
              </span>
              <h1 class="display-5 fs-2 fs-md-1 fw-extrabold text-white mb-3">
                Tu Ahorro Diario es Nuestra Prioridad
              </h1>
              <p class="lead text-white-50 mb-4">
                Encuentra abarrotes, bebidas, golosinas y productos frescos con entrega en minutos. Calidad garantizada para ti y tu familia.
              </p>

              <!-- Beneficios -->
              <div class="d-flex flex-wrap gap-3 pt-2">
                <div class="d-flex align-items-center gap-2 text-white small">
                  <i class="bi bi-truck text-warning fs-5"></i>
                  <span>Delivery Rápido</span>
                </div>
                <div class="d-flex align-items-center gap-2 text-white small">
                  <i class="bi bi-shield-check text-warning fs-5"></i>
                  <span>Pago 100% Seguro</span>
                </div>
                <div class="d-flex align-items-center gap-2 text-white small">
                  <i class="bi bi-receipt text-warning fs-5"></i>
                  <span>Boleta Electrónica SUNAT</span>
                </div>
              </div>
            </div>

            <div class="col-lg-5 text-center d-none d-lg-block">
              <div class="hero-image-card p-4 rounded-4 shadow-lg text-start bg-white">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <div class="d-flex align-items-center gap-2">
                    <div class="brand-logo-badge" style="width: 38px; height: 38px;">
                      <i class="bi bi-cart4 text-dark fs-5"></i>
                    </div>
                    <div>
                      <strong class="d-block text-dark">Promoción de la Semana</strong>
                      <small class="text-muted">Ahorro comprobado</small>
                    </div>
                  </div>
                  <span class="badge bg-danger rounded-pill px-2 py-1">-20% OFF</span>
                </div>
                <p class="small text-secondary mb-3">
                  Aprovecha los descuentos en marcas seleccionadas de canasta familiar. Haz tu pedido hoy mismo.
                </p>
                <div class="d-flex align-items-center justify-content-between border-top pt-2">
                  <span class="small text-muted">Monto mínimo delivery:</span>
                  <strong class="text-danger">S/ 10.00</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CATÁLOGO Y FILTROS -->
      <section class="py-5" id="seccionCatalogo">
        <div class="container">
          <!-- Filtro de Categorías -->
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
            <div>
              <h3 class="fw-bold text-dark mb-1">Catálogo de Productos</h3>
              <p class="text-muted small mb-0">Explora nuestras categorías y agrega tus favoritos al carrito.</p>
            </div>

            <!-- Chips de Categoría con scroll táctil en móvil -->
            <div class="category-scroll-bar d-flex gap-2 overflow-x-auto pb-2 flex-nowrap w-100 mt-2">
              <button class="btn btn-sm rounded-pill px-3 flex-shrink-0"
                      [class.btn-danger]="categoriaSeleccionada() === ''"
                      [class.btn-outline-secondary]="categoriaSeleccionada() !== ''"
                      (click)="seleccionarCategoria('')">
                Todas
              </button>
              @for (cat of categorias(); track cat.id) {
                <button class="btn btn-sm rounded-pill px-3 flex-shrink-0"
                        [class.btn-danger]="categoriaSeleccionada() === cat.nombre"
                        [class.btn-outline-secondary]="categoriaSeleccionada() !== cat.nombre"
                        (click)="seleccionarCategoria(cat.nombre)">
                  {{ cat.nombre }}
                </button>
              }
            </div>
          </div>

          <!-- Grid de Productos (2 por fila en móvil, 3 en tablet, 4 en desktop) -->
          @if (cargando()) {
            <div class="text-center py-5">
              <div class="spinner-border text-danger" role="status"></div>
              <p class="text-muted small mt-2">Cargando catálogo de productos...</p>
            </div>
          } @else if (productosFiltrados().length === 0) {
            <div class="text-center py-5">
              <i class="bi bi-search fs-1 text-muted d-block mb-2"></i>
              <h5 class="fw-bold text-secondary">No encontramos productos coincidentes</h5>
              <p class="text-muted small">Intenta con otra palabra de búsqueda o revisa otra categoría.</p>
              <button class="btn btn-sm btn-outline-danger" (click)="limpiarFiltros()">
                Ver Todo el Catálogo
              </button>
            </div>
          } @else {
            <div class="row g-2 g-sm-3 g-md-4">
              @for (p of productosFiltrados(); track p.id) {
                <div class="col-6 col-md-4 col-lg-3">
                  <div class="prod-card-cliente h-100 d-flex flex-column">
                    <div class="prod-img-wrap position-relative">
                      <img [src]="obtenerImagen(p)"
                           [alt]="p.nombre" loading="lazy"
                           onerror="this.src='https://placehold.co/400x300/f8fafc/94a3b8?text=Minimarket+Pool'">
                      <span class="prod-cat-badge">{{ p.categoriaNombre || 'General' }}</span>

                      @if (p.stockActual <= 0) {
                        <span class="prod-stock-badge bg-danger text-white">Agotado</span>
                      } @else if (p.stockActual <= (p.stockMinimo || 5)) {
                        <span class="prod-stock-badge bg-warning text-dark">¡Últimas {{ p.stockActual }} u.!</span>
                      } @else {
                        <span class="prod-stock-badge bg-success text-white">{{ p.stockActual }} disponibles</span>
                      }
                    </div>

                    <div class="prod-body p-3 d-flex flex-column flex-grow-1">
                      <h6 class="prod-titulo fw-bold mb-1" [title]="p.nombre">{{ p.nombre }}</h6>
                      <small class="text-muted d-block mb-2">SKU: {{ p.sku || '-' }}</small>

                      <div class="mt-auto pt-2 d-flex align-items-baseline justify-content-between">
                        <div>
                          <span class="prod-precio text-danger fw-bold fs-5">S/ {{ p.precioUnitario | number:'1.2-2' }}</span>
                          <small class="text-muted ms-1">/ unidad</small>
                        </div>
                      </div>

                      <button class="btn btn-danger w-100 mt-3 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                              [disabled]="p.stockActual <= 0"
                              (click)="clickAgregarAlCarrito(p)">
                        <i class="bi bi-cart-plus-fill"></i>
                        <span>{{ p.stockActual <= 0 ? 'Agotado' : 'Añadir al Carrito' }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </section>
    </main>

    <!-- FOOTER DE LA TIENDA -->
    <footer class="footer-cliente py-5 bg-dark text-white border-top border-secondary">
      <div class="container">
        <div class="row g-4 mb-4">
          <div class="col-lg-4 col-md-6">
            <div class="d-flex align-items-center gap-2 mb-3">
              <div class="brand-logo-badge" style="width: 38px; height: 38px;">
                <i class="bi bi-cart4 text-dark fs-5"></i>
              </div>
              <h5 class="mb-0 text-white fw-bold">MINIMARKET POOL</h5>
            </div>
            <p class="small text-white-50">
              Tu tienda de conveniencia favorita en Lima. Los mejores precios, promociones diarias y entrega rápida para que ahorres en cada compra.
            </p>
            <div class="d-flex gap-3 fs-5">
              <a href="javascript:void(0)" class="text-white-50 hover-text-white"><i class="bi bi-facebook"></i></a>
              <a href="javascript:void(0)" class="text-white-50 hover-text-white"><i class="bi bi-instagram"></i></a>
              <a href="javascript:void(0)" class="text-white-50 hover-text-white"><i class="bi bi-whatsapp"></i></a>
            </div>
          </div>

          <div class="col-lg-4 col-md-6">
            <h6 class="text-white fw-bold mb-3">Enlaces Rápidos</h6>
            <ul class="list-unstyled small d-flex flex-column gap-2 text-white-50">
              <li><a href="#seccionCatalogo" class="text-white-50 text-decoration-none">Catálogo Completo</a></li>
              <li><a href="javascript:void(0)" class="text-white-50 text-decoration-none" (click)="abrirModalAuth('login')">Ingresar a mi Cuenta</a></li>
              <li><a href="javascript:void(0)" class="text-white-50 text-decoration-none" (click)="abrirModalAuth('registro')">Crear Nueva Cuenta</a></li>
              <li>
                <a routerLink="/interno/login" class="text-warning text-decoration-none fw-semibold">
                  <i class="bi bi-shield-lock-fill me-1"></i> Acceso Personal de Tienda (Admin / POS)
                </a>
              </li>
            </ul>
          </div>

          <div class="col-lg-4 col-md-12">
            <h6 class="text-white fw-bold mb-3">Atención al Cliente</h6>
            <div class="small text-white-50 d-flex flex-column gap-2">
              <div><i class="bi bi-geo-alt me-2 text-danger"></i> Av. Los Rosales 1234, Lima - Perú</div>
              <div><i class="bi bi-telephone me-2 text-warning"></i> (01) 234-5678 / WhatsApp: 987 654 321</div>
              <div><i class="bi bi-envelope me-2 text-info"></i> ventas&#64;minimarketpool.com</div>
              <div><i class="bi bi-clock me-2 text-success"></i> Lun - Dom: 7:00 AM - 11:00 PM</div>
            </div>
          </div>
        </div>

        <div class="border-top border-secondary pt-3 text-center text-white-50 small">
          © 2026 Minimarket Pool S.A.C. Todos los derechos reservados. Sistema desarrollado en Angular + Spring Boot.
        </div>
      </div>
    </footer>

    <!-- OFFCANVAS CARRITO -->
    <app-cart-offcanvas (abrirLogin)="abrirModalAuth($event)"></app-cart-offcanvas>

    <!-- MODAL AUTENTICACIÓN (LOGIN / REGISTRO INTELIGENTE) -->
    <app-modal-auth [visible]="modalAuthVisible" [tabActiva]="modalAuthTab"
                    (cerrarModal)="modalAuthVisible = false">
    </app-modal-auth>

    <!-- MODAL REQUIERE CUENTA PARA COMPRAR -->
    <app-modal-requiere-cuenta (abrirAuth)="abrirModalAuth($event)"></app-modal-requiere-cuenta>

    <!-- MODAL CHECKOUT -->
    <app-modal-checkout (pedidoConfirmado)="onPedidoConfirmado($event)"></app-modal-checkout>

    <!-- MODAL BOLETA FORMAL SUNAT -->
    @if (modalBoletaVisible && ventaActual) {
      <div class="modal-backdrop fade show" (click)="modalBoletaVisible = false"></div>
      <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
        <div class="modal-dialog modal-dialog-centered modal-lg" style="max-width: 800px;">
          <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-danger text-white rounded-top-4">
              <h5 class="modal-title fw-bold">
                <i class="bi bi-check-circle-fill text-warning me-2"></i> ¡Comprobante de Venta Electrónico!
              </h5>
              <button type="button" class="btn-close btn-close-white" (click)="modalBoletaVisible = false" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body p-3">
              <app-boleta-sunat #boletaRef [venta]="ventaActual"></app-boleta-sunat>
            </div>
            <div class="modal-footer bg-light border-0 rounded-bottom-4 d-flex justify-content-between align-items-center">
              <small class="text-muted"><i class="bi bi-shield-check text-success me-1"></i> Comprobante electrónico válido según normativa SUNAT</small>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-secondary px-3" (click)="modalBoletaVisible = false">Cerrar</button>
                <button type="button" class="btn btn-danger fw-bold px-3 shadow-sm" (click)="boletaRef.imprimir()">
                  <i class="bi bi-printer-fill me-1"></i> Imprimir Boleta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .hero-cliente {
      background: linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #991b1b 100%);
      position: relative;
    }
    .brand-logo-badge {
      background: #fbbf24;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .prod-card-cliente {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .prod-card-cliente:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px -4px rgba(220, 38, 38, 0.12), 0 6px 12px -3px rgba(0, 0, 0, 0.06);
    }
    .prod-img-wrap {
      height: 180px;
      background: #f8fafc;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .prod-img-wrap img {
      max-height: 100%;
      width: 100%;
      object-fit: contain;
      padding: 12px;
      transition: transform 0.3s ease;
    }
    .prod-card-cliente:hover .prod-img-wrap img {
      transform: scale(1.05);
    }
    .prod-cat-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(15, 23, 42, 0.75);
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      backdrop-filter: blur(4px);
    }
    .prod-stock-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .prod-titulo {
      font-size: 0.95rem;
      color: #0f172a;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      height: 2.6em;
    }
    .category-scroll-bar {
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
    }
    .category-scroll-bar::-webkit-scrollbar {
      height: 4px;
    }
    .category-scroll-bar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
    @media (max-width: 575.98px) {
      .prod-img-wrap {
        height: 125px !important;
      }
      .prod-titulo {
        font-size: 0.82rem !important;
        height: 2.3em !important;
      }
      .prod-precio {
        font-size: 1rem !important;
      }
      .prod-cat-badge, .prod-stock-badge {
        font-size: 0.65rem !important;
        padding: 2px 6px !important;
      }
      .prod-body {
        padding: 10px !important;
      }
      .hero-cliente {
        padding-top: 1.5rem !important;
        padding-bottom: 2rem !important;
      }
    }
  `]
})
export class TiendaHomeComponent implements OnInit {
  private productoService = inject(ProductoService);
  private authService = inject(AuthService);
  private carritoService = inject(CarritoService);
  private ventaService = inject(VentaService);
  private clienteService = inject(ClienteService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  productos = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  categoriaSeleccionada = signal<string>('');
  textoBusqueda = signal<string>('');
  cargando = signal<boolean>(true);

  // Modales
  modalAuthVisible = false;
  modalAuthTab: 'login' | 'registro' = 'login';
  modalBoletaVisible = false;
  ventaActual: VentaResponse | null = null;

  modalHistorialVisible = false;
  historialCompras: VentaResponse[] = [];
  cargandoHistorial = false;

  modalPerfilVisible = false;
  perfilCliente: Cliente | null = null;
  guardandoPerfil = false;

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);
    this.productoService.listar().subscribe({
      next: prods => {
        this.productos.set(prods);
        this.cargando.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando.set(false);
        this.cdr.markForCheck();
        this.toastService.error('Error de Conexión', 'No se pudo conectar con el catálogo de productos.');
      }
    });

    this.productoService.listarCategorias().subscribe({
      next: cats => {
        this.categorias.set(cats);
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  productosFiltrados(): Producto[] {
    const query = this.textoBusqueda().toLowerCase().trim();
    const cat = this.categoriaSeleccionada();

    return this.productos().filter(p => {
      const matchQuery = !query || p.nombre.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query));
      const matchCat = !cat || p.categoriaNombre === cat;
      return matchQuery && matchCat;
    });
  }

  alBuscarTexto(q: string) {
    this.textoBusqueda.set(q);
  }

  seleccionarCategoria(cat: string) {
    this.categoriaSeleccionada.set(cat);
  }

  limpiarFiltros() {
    this.textoBusqueda.set('');
    this.categoriaSeleccionada.set('');
  }

  clickAgregarAlCarrito(p: Producto) {
    if (!this.authService.isLoggedIn()) {
      this.toastService.warning('Acceso Requerido', 'Para usar el carrito es necesario que inicie sesión o se registre.');
      this.carritoService.solicitarCuentaParaComprar(p);
      return;
    }
    this.carritoService.agregar(p);
  }

  obtenerImagen(p: Producto): string {
    if (p.imagenUrl && !p.imagenUrl.includes('images.unsplash.com')) {
      return p.imagenUrl;
    }
    const cat = (p.categoriaNombre || 'General').toLowerCase();
    const bg = cat.includes('lácteos') ? 'e0f2fe/0284c7' :
               cat.includes('bebidas') ? 'fef3c7/d97706' :
               cat.includes('abarrotes') ? 'fef2f2/dc2626' :
               cat.includes('snack') ? 'ffedd5/ea580c' :
               cat.includes('golosina') ? 'fdf4ff/c026d3' :
               cat.includes('panadería') ? 'fefce8/ca8a04' :
               cat.includes('limpieza') ? 'ecfdf5/059669' :
               cat.includes('cuidado') ? 'f0fdfa/0d9488' :
               cat.includes('conservas') ? 'eff6ff/2563eb' : 'f1f5f9/475569';
    const texto = encodeURIComponent(p.nombre.length > 24 ? p.nombre.substring(0, 21) + '...' : p.nombre);
    return `https://placehold.co/400x300/${bg}?text=${texto}&font=roboto`;
  }

  abrirModalAuth(tab: 'login' | 'registro') {
    this.modalAuthTab = tab;
    this.modalAuthVisible = true;
  }

  onPedidoConfirmado(venta: VentaResponse) {
    this.ventaActual = venta;
    this.modalBoletaVisible = true;
    this.cargarDatos(); // Recargar stock actualizado
  }

  abrirModalHistorial() {
    this.router.navigate(['/tienda/mi-cuenta'], { queryParams: { tab: 'pedidos' } });
  }

  abrirModalPerfil() {
    this.router.navigate(['/tienda/mi-cuenta'], { queryParams: { tab: 'perfil' } });
  }
}
