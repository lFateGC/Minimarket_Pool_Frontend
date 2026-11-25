import { Component, OnInit, inject, signal, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { VentaService } from '../../../core/services/venta.service';
import { ToastService } from '../../../core/services/toast.service';
import { Cliente, VentaResponse } from '../../../core/models';
import { NavbarClienteComponent } from '../components/navbar-cliente.component';
import { CartOffcanvasComponent } from '../components/cart-offcanvas.component';
import { ModalCheckoutComponent } from '../components/modal-checkout.component';
import { BoletaSunatComponent } from '../../../shared/components/boleta-sunat.component';

@Component({
  selector: 'app-mi-cuenta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NavbarClienteComponent,
    CartOffcanvasComponent,
    ModalCheckoutComponent,
    BoletaSunatComponent
  ],
  template: `
    <div class="mi-cuenta-page min-vh-100 d-flex flex-column bg-light">
      <!-- Navbar de la Tienda -->
      <app-navbar-cliente></app-navbar-cliente>

      <!-- Cart Offcanvas & Modal Checkout -->
      <app-cart-offcanvas></app-cart-offcanvas>
      <app-modal-checkout (pedidoConfirmado)="onPedidoConfirmado($event)"></app-modal-checkout>

      <main class="container py-4 flex-grow-1">
        <!-- BREADCRUMB & REGRESO -->
        <nav aria-label="breadcrumb" class="mb-3">
          <ol class="breadcrumb mb-0 align-items-center">
            <li class="breadcrumb-item">
              <a routerLink="/tienda" class="text-decoration-none text-muted">
                <i class="bi bi-house-door-fill me-1"></i> Tienda
              </a>
            </li>
            <li class="breadcrumb-item active text-danger fw-bold" aria-current="page">
              Mi Cuenta y Pedidos
            </li>
          </ol>
        </nav>

        <!-- HEADER HERO DEL CLIENTE -->
        <div class="card border-0 rounded-4 shadow-sm text-white mb-4 overflow-hidden perfil-hero-card">
          <div class="card-body p-4 p-md-5 position-relative">
            <div class="row align-items-center g-3">
              <!-- Avatar e Iniciales -->
              <div class="col-auto">
                <div class="perfil-avatar-circle shadow-lg">
                  {{ obtenerIniciales() }}
                </div>
              </div>

              <!-- Información Principal -->
              <div class="col">
                <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                  <h3 class="fw-bold mb-0 text-white">
                    {{ perfil()?.nombres || authService.currentUser()?.nombre }} {{ perfil()?.apellidos || '' }}
                  </h3>
                  <span class="badge bg-warning text-dark px-3 py-1 rounded-pill fw-bold">
                    <i class="bi bi-patch-check-fill me-1 text-primary"></i> Cliente Verificado
                  </span>
                  @if (authService.isAdmin()) {
                    <span class="badge bg-dark text-white px-2 py-1 rounded-pill small">
                      <i class="bi bi-shield-fill text-warning me-1"></i> Admin
                    </span>
                  }
                </div>

                <p class="text-white-50 mb-2 small">
                  <i class="bi bi-envelope-fill me-1"></i> {{ perfil()?.email || authService.currentUser()?.email }}
                  &nbsp;|&nbsp;
                  <i class="bi bi-card-heading me-1"></i> {{ perfil()?.tipoDocumento || 'DNI' }}: {{ perfil()?.numeroDocumento || 'No registrado' }}
                  &nbsp;|&nbsp;
                  <i class="bi bi-telephone-fill me-1"></i> {{ perfil()?.telefono || 'Sin teléfono registrado' }}
                </p>

                <div class="d-flex align-items-center gap-2 flex-wrap text-white-50 small">
                  <span>
                    <i class="bi bi-geo-alt-fill text-warning me-1"></i>
                    Dirección favorita: <strong>{{ perfil()?.direccion || 'Aún no has registrado dirección' }}</strong>
                  </span>
                </div>
              </div>

              <!-- Botón Volver a la Tienda -->
              <div class="col-12 col-md-auto text-md-end mt-3 mt-md-0">
                <a routerLink="/tienda" class="btn btn-light fw-bold text-danger px-4 py-2 rounded-pill shadow-sm">
                  <i class="bi bi-arrow-left me-1"></i> Seguir Comprando
                </a>
              </div>
            </div>

            <!-- Mini KPIs de Compras -->
            <div class="row g-2 mt-4 pt-3 border-top border-white-50">
              <div class="col-4 col-md-3">
                <div class="small text-white-50 fw-semibold">PEDIDOS REALIZADOS</div>
                <div class="fs-4 fw-bold text-white">{{ pedidos().length }}</div>
              </div>
              <div class="col-4 col-md-3">
                <div class="small text-white-50 fw-semibold">TOTAL COMPRADO</div>
                <div class="fs-4 fw-bold text-warning">S/ {{ calcularTotalInvertido() | number:'1.2-2' }}</div>
              </div>
              <div class="col-4 col-md-3">
                <div class="small text-white-50 fw-semibold">ESTADO CUENTA</div>
                <div class="fs-5 fw-bold text-success-emphasis">
                  <span class="badge bg-success text-white px-2 py-1">Activo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TABS DE NAVEGACIÓN (Scrollable táctil en móvil) -->
        <ul class="nav nav-pills bg-white p-2 rounded-4 shadow-sm mb-4 border flex-nowrap overflow-x-auto gap-1">
          <li class="nav-item flex-shrink-0">
            <button class="nav-link fw-bold py-2 rounded-3 text-nowrap"
                    [class.active]="tabActiva() === 'pedidos'"
                    (click)="cambiarTab('pedidos')">
              <i class="bi bi-bag-check-fill me-2"></i> Mis Pedidos y Compras
              <span class="badge rounded-pill ms-2"
                    [class.bg-danger]="tabActiva() !== 'pedidos'"
                    [class.bg-white]="tabActiva() === 'pedidos'"
                    [class.text-danger]="tabActiva() === 'pedidos'">
                {{ pedidos().length }}
              </span>
            </button>
          </li>
          <li class="nav-item flex-shrink-0">
            <button class="nav-link fw-bold py-2 rounded-3 text-nowrap"
                    [class.active]="tabActiva() === 'perfil'"
                    (click)="cambiarTab('perfil')">
              <i class="bi bi-person-lines-fill me-2"></i> Mi Perfil y Facturación
            </button>
          </li>
          <li class="nav-item flex-shrink-0">
            <button class="nav-link fw-bold py-2 rounded-3 text-nowrap"
                    [class.active]="tabActiva() === 'seguridad'"
                    (click)="cambiarTab('seguridad')">
              <i class="bi bi-shield-lock-fill me-2"></i> Seguridad y Cuenta
            </button>
          </li>
        </ul>

        <!-- CONTENIDO TAB 1: MIS PEDIDOS -->
        @if (tabActiva() === 'pedidos') {
          <div class="pedidos-section">
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h5 class="fw-bold mb-0 text-dark">Historial de Compras en Minimarket Pool</h5>
                <small class="text-muted">Consulta el detalle de cada pedido, método de pago y boleta oficial SUNAT.</small>
              </div>
              <button class="btn btn-outline-secondary btn-sm rounded-pill px-3" (click)="cargarPedidos()">
                <i class="bi bi-arrow-clockwise me-1"></i> Actualizar
              </button>
            </div>

            @if (cargandoPedidos()) {
              <div class="text-center py-5">
                <div class="spinner-border text-danger"></div>
                <p class="text-muted small mt-2">Cargando tus compras...</p>
              </div>
            } @else if (pedidos().length === 0) {
              <div class="card border-0 rounded-4 shadow-sm p-5 text-center bg-white my-4">
                <div class="mx-auto mb-3 bg-danger-subtle text-danger rounded-circle d-flex align-items-center justify-content-center"
                     style="width: 80px; height: 80px;">
                  <i class="bi bi-bag-x fs-1"></i>
                </div>
                <h4 class="fw-bold text-dark mb-2">Aún no has realizado ningún pedido</h4>
                <p class="text-muted small mx-auto mb-4" style="max-width: 420px;">
                  Explora nuestras ofertas diarias, abarrotes y bebidas con los mejores precios de Lima.
                </p>
                <div>
                  <a routerLink="/tienda" class="btn btn-danger fw-bold px-4 py-2 rounded-pill shadow-sm">
                    <i class="bi bi-cart3 me-2"></i> Explorar Catálogo de Productos
                  </a>
                </div>
              </div>
            } @else {
              <div class="row g-3">
                @for (p of pedidos(); track p.id) {
                  <div class="col-12">
                    <div class="card border-0 rounded-4 shadow-sm bg-white overflow-hidden order-card">
                      <!-- Cabecera de la Tarjeta del Pedido -->
                      <div class="card-header bg-light border-0 py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div class="d-flex align-items-center gap-3">
                          <span class="badge bg-dark fs-6 px-3 py-2 rounded-pill">
                            #Pedido {{ p.id }}
                          </span>
                          <div>
                            <span class="small text-muted d-block">Fecha de Compra</span>
                            <strong class="text-dark">{{ formatearFecha(p.fecha) }}</strong>
                          </div>
                        </div>

                        <div class="d-flex align-items-center gap-2">
                          <span class="badge px-3 py-2 rounded-pill fw-bold"
                                [ngClass]="p.metodoPago === 'YAPE' ? 'bg-primary' : (p.metodoPago === 'PLIN' ? 'bg-info text-dark' : (p.metodoPago === 'EFECTIVO' ? 'bg-success' : 'bg-warning text-dark'))">
                            {{ p.metodoPago }}
                          </span>
                          <span class="badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill fw-bold">
                            <i class="bi bi-check-circle-fill me-1"></i> Completado
                          </span>
                        </div>
                      </div>

                      <!-- Cuerpo del Pedido -->
                      <div class="card-body p-4">
                        <div class="row g-3 align-items-center">
                          <!-- Lista de ítems o descripción -->
                          <div class="col-lg-8">
                            <div class="small fw-bold text-muted mb-2">PRODUCTOS COMPRADOS:</div>

                            @if (p.detalles && p.detalles.length > 0) {
                              <div class="d-flex flex-column gap-2">
                                @for (det of p.detalles; track det.id) {
                                  <div class="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border-start border-3 border-danger">
                                    <div class="d-flex align-items-center gap-2">
                                      <span class="badge bg-danger rounded-pill">{{ det.cantidad }}x</span>
                                      <span class="fw-semibold text-dark">{{ det.productoNombre }}</span>
                                    </div>
                                    <div class="text-end">
                                      <span class="small text-muted me-2">S/ {{ det.precioUnitario | number:'1.2-2' }} c/u</span>
                                      <strong class="text-dark">S/ {{ det.subtotal | number:'1.2-2' }}</strong>
                                    </div>
                                  </div>
                                }
                              </div>
                            } @else {
                              <p class="mb-0 text-muted small">
                                Compra por catálogo de Minimarket Pool realizada a través de la plataforma web.
                              </p>
                            }

                            @if (p.clienteDireccion) {
                              <div class="mt-3 small text-muted">
                                <i class="bi bi-geo-alt-fill text-danger me-1"></i>
                                <span>Entrega: {{ p.clienteDireccion }}</span>
                              </div>
                            }
                          </div>

                          <!-- Resumen de Costo y Acción Boleta -->
                          <div class="col-lg-4 text-lg-end border-start-lg pt-3 pt-lg-0">
                            <div class="p-3 bg-light rounded-3 text-center text-lg-end mb-3">
                              <span class="small text-muted d-block">TOTAL CANCELADO:</span>
                              <span class="fs-3 fw-bold text-danger">S/ {{ p.total | number:'1.2-2' }}</span>
                              <div class="small text-muted mt-1" style="font-size: 0.75rem;">
                                Subtotal: S/ {{ (p.subtotal || (p.total / 1.18)) | number:'1.2-2' }} | I.G.V. 18%: S/ {{ (p.igv || (p.total - (p.total / 1.18))) | number:'1.2-2' }}
                              </div>
                            </div>

                            <button class="btn btn-outline-danger fw-bold w-100 rounded-pill py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                                    (click)="abrirBoleta(p)">
                              <i class="bi bi-receipt-cutoff"></i> Ver Boleta SUNAT
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- CONTENIDO TAB 2: MI PERFIL Y DATOS DE FACTURACIÓN -->
        @if (tabActiva() === 'perfil') {
          <div class="perfil-section">
            <div class="card border-0 rounded-4 shadow-sm bg-white p-4 p-md-5">
              <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom flex-wrap gap-2">
                <div>
                  <h4 class="fw-bold mb-1 text-dark">
                    <i class="bi bi-person-vcard text-danger me-2"></i> Información de Perfil y Entrega
                  </h4>
                  <p class="text-muted small mb-0">Mantén actualizados tus datos para coordinar el envío de tus pedidos sin demoras.</p>
                </div>
                <span class="badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill fw-bold">
                  <i class="bi bi-shield-check me-1"></i> Datos Verificados
                </span>
              </div>

              @if (cargandoPerfil()) {
                <div class="text-center py-5">
                  <div class="spinner-border text-danger"></div>
                </div>
              } @else {
                <form (ngSubmit)="guardarPerfil()">
                  <div class="row g-4">
                    <!-- Columna 1: Datos Personales (Identidad) -->
                    <div class="col-md-6">
                      <div class="card border rounded-4 p-3 bg-light h-100">
                        <h6 class="fw-bold text-dark mb-3">
                          <i class="bi bi-person-badge-fill text-primary me-2"></i> Identidad y Facturación
                        </h6>

                        <div class="mb-3">
                          <label class="form-label small fw-bold text-muted">Nombres *</label>
                          <input type="text" class="form-control form-control-lg bg-white"
                                 [(ngModel)]="perfilForm.nombres" name="nombres" required>
                        </div>

                        <div class="mb-3">
                          <label class="form-label small fw-bold text-muted">Apellidos *</label>
                          <input type="text" class="form-control form-control-lg bg-white"
                                 [(ngModel)]="perfilForm.apellidos" name="apellidos" required>
                        </div>

                        <div class="row g-2 mb-3">
                          <div class="col-4">
                            <label class="form-label small fw-bold text-muted">Tipo Doc.</label>
                            <input type="text" class="form-control bg-light"
                                   [value]="perfil()?.tipoDocumento || 'DNI'" readonly disabled>
                          </div>
                          <div class="col-8">
                            <label class="form-label small fw-bold text-muted">Número de Documento</label>
                            <div class="input-group">
                              <input type="text" class="form-control bg-light"
                                     [value]="perfil()?.numeroDocumento || ''" readonly disabled>
                              <span class="input-group-text bg-light text-success" title="Documento Validador">
                                <i class="bi bi-check-circle-fill"></i>
                              </span>
                            </div>
                            <small class="text-muted" style="font-size: 0.75rem;">Protegido para comprobantes fiscales SUNAT.</small>
                          </div>
                        </div>

                        <div class="mb-2">
                          <label class="form-label small fw-bold text-muted">Correo Electrónico (Usuario de Acceso)</label>
                          <input type="email" class="form-control bg-light"
                                 [value]="perfil()?.email || authService.currentUser()?.email" readonly disabled>
                          <small class="text-muted" style="font-size: 0.75rem;">Para cambiar tu correo comunícate con administración.</small>
                        </div>
                      </div>
                    </div>

                    <!-- Columna 2: Contacto y Entrega a Domicilio -->
                    <div class="col-md-6">
                      <div class="card border rounded-4 p-3 bg-light h-100">
                        <h6 class="fw-bold text-dark mb-3">
                          <i class="bi bi-geo-alt-fill text-danger me-2"></i> Contacto & Dirección de Delivery
                        </h6>

                        <div class="mb-3">
                          <label class="form-label small fw-bold text-muted">Teléfono Móvil / WhatsApp *</label>
                          <div class="input-group input-group-lg">
                            <span class="input-group-text bg-white text-muted">+51</span>
                            <input type="tel" class="form-control bg-white"
                                   [(ngModel)]="perfilForm.telefono" name="telefono"
                                   placeholder="987654321" maxlength="9" required>
                          </div>
                          <small class="text-muted">El repartidor se comunicará a este número para avisar su llegada.</small>
                        </div>

                        <div class="mb-3">
                          <label class="form-label small fw-bold text-muted">Dirección Principal de Entrega *</label>
                          <textarea class="form-control bg-white" rows="3"
                                    [(ngModel)]="perfilForm.direccion" name="direccion"
                                    placeholder="Ej: Av. Los Rosales 1234, Dpto. 402 - Los Olivos, Lima" required></textarea>
                          <small class="text-muted">Se rellenará automáticamente cada vez que hagas compras.</small>
                        </div>

                        <div class="alert alert-warning-subtle border border-warning-subtle small mb-0 rounded-3">
                          <i class="bi bi-info-circle-fill text-warning me-1"></i>
                          Los pedidos se entregan en menos de 45 minutos dentro de la zona de cobertura oficial de Minimarket Pool.
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Botón de Guardar -->
                  <div class="text-end mt-4 pt-3 border-top">
                    <button type="submit" class="btn btn-danger btn-lg px-5 py-2 fw-bold rounded-pill shadow"
                            [disabled]="guardandoPerfil()">
                      @if (guardandoPerfil()) {
                        <span class="spinner-border spinner-border-sm me-2"></span> Guardando Cambios...
                      } @else {
                        <i class="bi bi-save2-fill me-2"></i> Actualizar Datos de Perfil
                      }
                    </button>
                  </div>
                </form>
              }
            </div>
          </div>
        }

        <!-- CONTENIDO TAB 3: SEGURIDAD Y CUENTA -->
        @if (tabActiva() === 'seguridad') {
          <div class="seguridad-section">
            <div class="card border-0 rounded-4 shadow-sm bg-white p-4 p-md-5">
              <h4 class="fw-bold mb-1 text-dark">
                <i class="bi bi-shield-lock text-danger me-2"></i> Estado de Cuenta y Seguridad
              </h4>
              <p class="text-muted small mb-4">Información sobre la sesión actual y controles de acceso.</p>

              <div class="row g-3">
                <div class="col-md-6">
                  <div class="p-3 bg-light rounded-3 border">
                    <span class="small text-muted d-block">TIPO DE USUARIO:</span>
                    <strong class="text-dark fs-6">{{ authService.currentUser()?.rol || 'CLIENTE' }}</strong>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="p-3 bg-light rounded-3 border">
                    <span class="small text-muted d-block">PROTECCIÓN DE ACCESO:</span>
                    <span class="badge bg-success px-3 py-2 rounded-pill fw-bold">
                      <i class="bi bi-check-shield-fill me-1"></i> Autenticación Stateless JWT Activa
                    </span>
                  </div>
                </div>

                <div class="col-12 mt-4 pt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <strong class="text-dark d-block">¿Deseas cerrar tu sesión en este dispositivo?</strong>
                    <small class="text-muted">Tendrás que volver a autenticarte con tu correo y contraseña.</small>
                  </div>
                  <button class="btn btn-outline-danger fw-bold rounded-pill px-4 py-2"
                          (click)="cerrarSesion()">
                    <i class="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </main>

      <!-- MODAL BOLETA FORMAL SUNAT -->
      @if (modalBoletaVisible && ventaSeleccionada) {
        <div class="modal-backdrop fade show" (click)="modalBoletaVisible = false" style="z-index: 1065;"></div>
        <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" style="z-index: 1070;">
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content rounded-4 border-0 shadow-lg">
              <div class="modal-header bg-dark text-white rounded-top-4 py-3">
                <h5 class="modal-title fw-bold">
                  <i class="bi bi-receipt-cutoff me-2 text-warning"></i> Comprobante Electrónico SUNAT
                </h5>
                <button type="button" class="btn-close btn-close-white" (click)="modalBoletaVisible = false" aria-label="Cerrar"></button>
              </div>
              <div class="modal-body p-3">
                <app-boleta-sunat #boletaRef [venta]="ventaSeleccionada"></app-boleta-sunat>
              </div>
              <div class="modal-footer bg-light border-0 rounded-bottom-4 d-flex justify-content-between align-items-center">
                <small class="text-muted">
                  <i class="bi bi-shield-check text-success me-1"></i> Comprobante electrónico oficial registrado
                </small>
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-secondary px-3" (click)="modalBoletaVisible = false">Cerrar</button>
                  <button type="button" class="btn btn-danger fw-bold px-4" (click)="boletaRef.imprimir()">
                    <i class="bi bi-printer-fill me-1"></i> Imprimir / Descargar PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- FOOTER CORPORATIVO -->
      <footer class="bg-dark text-white py-4 mt-auto">
        <div class="container text-center small text-white-50">
          <div class="mb-2">
            <strong class="text-white">MINIMARKET POOL S.A.C.</strong> &nbsp;|&nbsp;
            RUC: 20608912345 &nbsp;|&nbsp;
            "Tu ahorro es nuestra prioridad"
          </div>
          <div>Atención al Cliente: (01) 234-5678 / WhatsApp: 987 654 321</div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .perfil-hero-card {
      background: linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #ef4444 100%);
    }
    .perfil-avatar-circle {
      width: 82px;
      height: 82px;
      border-radius: 50%;
      background: #fbbf24;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 800;
      border: 4px solid rgba(255, 255, 255, 0.4);
    }
    .order-card {
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .order-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08) !important;
    }
    @media (min-width: 992px) {
      .border-start-lg {
        border-left: 1px solid #e2e8f0;
      }
    }
  `]
})
export class MiCuentaComponent implements OnInit {
  public authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private ventaService = inject(VentaService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('boletaRef') boletaRef!: BoletaSunatComponent;

  tabActiva = signal<'pedidos' | 'perfil' | 'seguridad'>('pedidos');

  perfil = signal<Cliente | null>(null);
  cargandoPerfil = signal<boolean>(false);
  guardandoPerfil = signal<boolean>(false);

  perfilForm = {
    nombres: '',
    apellidos: '',
    telefono: '',
    direccion: ''
  };

  pedidos = signal<VentaResponse[]>([]);
  cargandoPedidos = signal<boolean>(false);

  modalBoletaVisible = false;
  ventaSeleccionada: VentaResponse | null = null;

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.toastService.info('Identificación requerida', 'Inicia sesión para ingresar a tu cuenta.');
      this.router.navigate(['/tienda']);
      return;
    }

    // Leer tab de la URL si viene especificado
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'perfil') {
        this.tabActiva.set('perfil');
      } else if (params['tab'] === 'seguridad') {
        this.tabActiva.set('seguridad');
      } else {
        this.tabActiva.set('pedidos');
      }
    });

    this.cargarPerfil();
    this.cargarPedidos();
  }

  cambiarTab(tab: 'pedidos' | 'perfil' | 'seguridad') {
    this.tabActiva.set(tab);
  }

  cargarPerfil() {
    this.cargandoPerfil.set(true);
    this.clienteService.obtenerMiPerfil().subscribe({
      next: p => {
        this.perfil.set(p);
        this.perfilForm = {
          nombres: p.nombres || '',
          apellidos: p.apellidos || '',
          telefono: p.telefono || '',
          direccion: p.direccion || ''
        };
        this.cargandoPerfil.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargandoPerfil.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  guardarPerfil() {
    this.guardandoPerfil.set(true);
    this.clienteService.actualizarMiPerfil(this.perfilForm).subscribe({
      next: actualizado => {
        this.perfil.set(actualizado);
        this.guardandoPerfil.set(false);
        this.toastService.success('Perfil Actualizado', 'Tus datos personales y de entrega fueron guardados con éxito.');
        this.cdr.markForCheck();
      },
      error: err => {
        this.guardandoPerfil.set(false);
        this.toastService.error('Error al Guardar', err.error?.mensaje || 'No se pudo actualizar tu perfil.');
        this.cdr.markForCheck();
      }
    });
  }

  cargarPedidos() {
    this.cargandoPedidos.set(true);
    this.ventaService.obtenerMisCompras().subscribe({
      next: lista => {
        this.pedidos.set(lista || []);
        this.cargandoPedidos.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargandoPedidos.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  calcularTotalInvertido(): number {
    return this.pedidos().reduce((acc, p) => acc + (p.total || 0), 0);
  }

  obtenerIniciales(): string {
    const nombres = (this.perfil()?.nombres || this.authService.currentUser()?.nombre || 'KG').trim();
    const apellidos = (this.perfil()?.apellidos || '').trim();
    const i1 = nombres.charAt(0).toUpperCase();
    const i2 = apellidos ? apellidos.charAt(0).toUpperCase() : (nombres.length > 1 ? nombres.charAt(1).toUpperCase() : '');
    return `${i1}${i2}`;
  }

  formatearFecha(f: string): string {
    if (!f) return '-';
    try {
      const d = new Date(f);
      return d.toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return f;
    }
  }

  abrirBoleta(venta: VentaResponse) {
    this.ventaSeleccionada = venta;
    this.modalBoletaVisible = true;
  }

  onPedidoConfirmado(venta: VentaResponse) {
    this.cargarPedidos();
    this.abrirBoleta(venta);
  }

  cerrarSesion() {
    this.authService.logout('/tienda');
  }
}
