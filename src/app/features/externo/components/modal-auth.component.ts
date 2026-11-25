import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CarritoService } from '../../../core/services/carrito.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoginRequest, RegistroClienteRequest, VerificacionDocumentoResponse } from '../../../core/models';

@Component({
  selector: 'app-modal-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible) {
      <div class="modal-backdrop fade show" (click)="cerrar()"></div>

      <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
          <div class="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
            <!-- Header Brand -->
            <div class="p-3 text-center bg-danger text-white position-relative">
              <div class="d-inline-flex align-items-center justify-content-center mb-1 brand-logo-badge mx-auto">
                <i class="bi bi-cart4 text-dark fs-3"></i>
              </div>
              <h5 class="fw-bold mb-0">MINIMARKET POOL</h5>
              <small class="text-warning fst-italic">Tu cuenta de cliente</small>
              <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3"
                      (click)="cerrar()" aria-label="Cerrar"></button>
            </div>

            <div class="p-4">
              <!-- Selector de Pestañas -->
              <ul class="nav nav-pills nav-fill mb-3 bg-light rounded-3 p-1">
                <li class="nav-item">
                  <button class="nav-link py-2 fw-bold" [class.active]="tabActiva === 'login'"
                          (click)="cambiarTab('login')">
                    Ingresar
                  </button>
                </li>
                <li class="nav-item">
                  <button class="nav-link py-2 fw-bold" [class.active]="tabActiva === 'registro'"
                          (click)="cambiarTab('registro')">
                    Registrarme
                  </button>
                </li>
              </ul>

              <!-- PANEL LOGIN -->
              @if (tabActiva === 'login') {
                <form (ngSubmit)="ejecutarLogin()">
                  <div class="mb-3">
                    <label class="form-label small fw-bold text-muted">Correo Electrónico</label>
                    <input type="email" class="form-control" [(ngModel)]="loginData.email" name="email"
                           placeholder="cliente&#64;correo.com" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label small fw-bold text-muted">Contraseña</label>
                    <input type="password" class="form-control" [(ngModel)]="loginData.password" name="password"
                           placeholder="••••••••" required>
                  </div>
                  <button type="submit" class="btn btn-danger w-100 py-2 fw-bold shadow-sm" [disabled]="cargando">
                    @if (cargando) {
                      <span class="spinner-border spinner-border-sm me-2"></span> Ingresando...
                    } @else {
                      <i class="bi bi-box-arrow-in-right me-1"></i> Ingresar a mi Cuenta
                    }
                  </button>
                </form>
              }

              <!-- PANEL REGISTRO INTELIGENTE -->
              @if (tabActiva === 'registro') {
                <form (ngSubmit)="ejecutarRegistro()">
                  <div class="row g-2">
                    <!-- Documento Primero -->
                    <div class="col-5">
                      <label class="form-label small fw-bold text-muted">Tipo Doc. *</label>
                      <select class="form-select form-select-sm" [(ngModel)]="regData.tipoDocumento" name="tipoDocumento"
                              (change)="alCambiarTipoDoc()">
                        <option value="DNI">DNI</option>
                        <option value="RUC">RUC</option>
                        <option value="CE">C.E.</option>
                      </select>
                    </div>

                    <div class="col-7">
                      <label class="form-label small fw-bold text-muted">N° Documento *</label>
                      <div class="input-group input-group-sm">
                        <input type="text" class="form-control" [(ngModel)]="regData.numeroDocumento" name="numeroDocumento"
                               [placeholder]="regData.tipoDocumento === 'DNI' ? '8 dígitos' : '11 dígitos'"
                               [maxLength]="regData.tipoDocumento === 'DNI' ? 8 : 11"
                               (input)="alEscribirDoc()" (blur)="verificarDoc(false)" required>
                        <button class="btn btn-outline-secondary" type="button" (click)="verificarDoc(true)" title="Verificar documento">
                          @if (verificandoDoc) {
                            <span class="spinner-border spinner-border-sm text-secondary"></span>
                          } @else {
                            <i class="bi bi-search"></i>
                          }
                        </button>
                      </div>
                    </div>

                    <!-- Alertas Dinámicas de Reconocimiento -->
                    @if (verifResultado) {
                      <div class="col-12">
                        @if (verifResultado.registradoEnTienda && !verifResultado.tieneCuentaWeb) {
                          <div class="p-2 rounded-3 bg-primary-subtle border border-primary-subtle text-primary small d-flex align-items-start gap-2 shadow-sm">
                            <i class="bi bi-person-check-fill fs-5 mt-0"></i>
                            <div>
                              <div class="fw-bold">¡Hola, {{ verifResultado.nombres }}! Ya compraste antes en nuestra tienda física.</div>
                              <div class="text-dark small mt-1">
                                Tus datos fueron reconocidos. Completa tu <span class="badge bg-primary">Correo</span>, <span class="badge bg-primary">Contraseña</span> y <span class="badge bg-primary">Dirección</span> para activar tu cuenta online.
                              </div>
                            </div>
                          </div>
                        } @else if (verifResultado.registradoEnTienda && verifResultado.tieneCuentaWeb) {
                          <div class="p-2 rounded-3 bg-warning-subtle border border-warning-subtle text-dark small d-flex align-items-start gap-2 shadow-sm">
                            <i class="bi bi-exclamation-triangle-fill fs-5 text-warning mt-0"></i>
                            <div>
                              <div class="fw-bold">Ya cuentas con una cuenta web activa.</div>
                              <div class="small mt-1">Este documento ya está vinculado a un usuario web. Por favor inicia sesión con tu correo.</div>
                              <button type="button" class="btn btn-sm btn-dark mt-2 fw-semibold px-3" (click)="cambiarTab('login')">
                                <i class="bi bi-box-arrow-in-right me-1"></i> Ir a Iniciar Sesión
                              </button>
                            </div>
                          </div>
                        } @else {
                          <div class="p-2 rounded-3 bg-light border text-muted small d-flex align-items-center gap-2">
                            <i class="bi bi-sparkles text-warning fs-5"></i>
                            <span>Nuevo cliente: Completa los datos para registrarte y empezar a comprar.</span>
                          </div>
                        }
                      </div>
                    }

                    <!-- Nombres y Apellidos -->
                    <div class="col-6">
                      <div class="d-flex justify-content-between align-items-center">
                        <label class="form-label small fw-bold text-muted mb-0">Nombres *</label>
                        @if (nombresBloqueados) {
                          <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none text-muted"
                                  style="font-size: 0.72rem;" (click)="nombresBloqueados = false">
                            <i class="bi bi-pencil-square"></i> Editar
                          </button>
                        }
                      </div>
                      <input type="text" class="form-control form-control-sm mt-1" [(ngModel)]="regData.nombres" name="nombres"
                             [readOnly]="nombresBloqueados" [class.bg-light]="nombresBloqueados" required>
                    </div>

                    @if (regData.tipoDocumento !== 'RUC') {
                      <div class="col-6">
                        <label class="form-label small fw-bold text-muted">Apellidos</label>
                        <input type="text" class="form-control form-control-sm mt-1" [(ngModel)]="regData.apellidos" name="apellidos"
                               [readOnly]="nombresBloqueados" [class.bg-light]="nombresBloqueados">
                      </div>
                    }

                    <!-- Correo y Contraseña -->
                    <div class="col-12">
                      <label class="form-label small fw-bold text-muted">Correo Electrónico (Para iniciar sesión) *</label>
                      <input type="email" class="form-control form-control-sm" [(ngModel)]="regData.email" name="email"
                             placeholder="cliente&#64;correo.com" required>
                    </div>

                    <div class="col-12">
                      <label class="form-label small fw-bold text-muted">Contraseña Web *</label>
                      <input type="password" class="form-control form-control-sm" [(ngModel)]="regData.password" name="password"
                             placeholder="Mínimo 6 caracteres" minlength="6" required>
                    </div>

                    <!-- Teléfono y Dirección -->
                    <div class="col-12">
                      <label class="form-label small fw-bold text-muted">Teléfono / WhatsApp *</label>
                      <input type="tel" class="form-control form-control-sm" [(ngModel)]="regData.telefono" name="telefono"
                             placeholder="987654321" required>
                    </div>

                    <div class="col-12">
                      <label class="form-label small fw-bold text-muted">Dirección de Entrega a Domicilio *</label>
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="regData.direccion" name="direccion"
                             placeholder="Av. / Calle, Número, Referencia" required>
                    </div>
                  </div>

                  <button type="submit" class="btn btn-danger w-100 py-2 fw-bold mt-3 shadow-sm"
                          [disabled]="cargando || (verifResultado?.tieneCuentaWeb)">
                    @if (cargando) {
                      <span class="spinner-border spinner-border-sm me-2"></span> Procesando...
                    } @else if (verifResultado?.registradoEnTienda && !verifResultado?.tieneCuentaWeb) {
                      <i class="bi bi-check2-circle me-1"></i> Activar mi Cuenta Online
                    } @else {
                      <i class="bi bi-person-plus-fill me-1"></i> Crear Cuenta y Continuar
                    }
                  </button>
                </form>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .brand-logo-badge {
      width: 44px;
      height: 44px;
      background: #fbbf24;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class ModalAuthComponent {
  private authService = inject(AuthService);
  private carritoService = inject(CarritoService);
  private toastService = inject(ToastService);

  @Input() visible = false;
  @Input() tabActiva: 'login' | 'registro' = 'login';
  @Output() cerrarModal = new EventEmitter<void>();

  cargando = false;
  verificandoDoc = false;
  nombresBloqueados = false;
  verifResultado: VerificacionDocumentoResponse | null = null;
  private timerVerif: any = null;

  loginData: LoginRequest = { email: '', password: '' };
  regData: RegistroClienteRequest = {
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    telefono: '',
    direccion: ''
  };

  cambiarTab(tab: 'login' | 'registro') {
    this.tabActiva = tab;
  }

  cerrar() {
    this.visible = false;
    this.cerrarModal.emit();
  }

  alCambiarTipoDoc() {
    this.verifResultado = null;
    this.nombresBloqueados = false;
  }

  alEscribirDoc() {
    if (this.regData.tipoDocumento === 'DNI' || this.regData.tipoDocumento === 'RUC') {
      this.regData.numeroDocumento = this.regData.numeroDocumento.replace(/\D/g, '');
    }

    if (this.timerVerif) clearTimeout(this.timerVerif);
    const len = this.regData.tipoDocumento === 'DNI' ? 8 : (this.regData.tipoDocumento === 'RUC' ? 11 : 8);

    if (this.regData.numeroDocumento.length === len) {
      this.timerVerif = setTimeout(() => this.verificarDoc(false), 300);
    } else {
      this.verifResultado = null;
      this.nombresBloqueados = false;
    }
  }

  verificarDoc(forzar = false) {
    const doc = this.regData.numeroDocumento.trim();
    const minLen = this.regData.tipoDocumento === 'DNI' ? 8 : 11;
    if (doc.length < minLen) {
      if (forzar) this.toastService.warning('Validación', `El documento debe tener al menos ${minLen} dígitos.`);
      return;
    }

    this.verificandoDoc = true;
    this.authService.verificarDocumento(doc).subscribe({
      next: res => {
        this.verificandoDoc = false;
        this.verifResultado = res;

        if (res.registradoEnTienda && !res.tieneCuentaWeb) {
          if (res.nombres) {
            this.regData.nombres = res.nombres;
            this.nombresBloqueados = true;
          }
          if (res.apellidos) this.regData.apellidos = res.apellidos;
          if (res.telefono && !this.regData.telefono) this.regData.telefono = res.telefono;
          if (res.direccion && !this.regData.direccion) this.regData.direccion = res.direccion;
        } else {
          this.nombresBloqueados = false;
        }
      },
      error: () => {
        this.verificandoDoc = false;
      }
    });
  }

  ejecutarLogin() {
    if (!this.loginData.email || !this.loginData.password) {
      this.toastService.warning('Campos Requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    this.cargando = true;
    this.authService.login(this.loginData).subscribe({
      next: res => {
        this.cargando = false;
        this.toastService.success('¡Bienvenido!', `Hola ${res.nombre}`);
        this.finalizarAutenticacion();
      },
      error: err => {
        this.cargando = false;
        this.toastService.error('Error de Acceso', err.error?.mensaje || 'Correo o contraseña incorrectos.');
      }
    });
  }

  ejecutarRegistro() {
    if (this.verifResultado?.tieneCuentaWeb) {
      this.toastService.warning('Cuenta Existente', 'Este documento ya tiene una cuenta activa. Inicia sesión con tu correo.');
      this.cambiarTab('login');
      return;
    }

    this.cargando = true;
    this.authService.registrarCliente(this.regData).subscribe({
      next: res => {
        this.cargando = false;
        this.toastService.success('¡Cuenta Activada!', `Bienvenido a Minimarket Pool, ${res.nombre}`);
        this.finalizarAutenticacion();
      },
      error: err => {
        this.cargando = false;
        this.toastService.error('Error de Registro', err.error?.mensaje || 'No se pudo registrar la cuenta.');
      }
    });
  }

  private finalizarAutenticacion() {
    this.cerrar();

    // Si había un producto pendiente que el usuario intentó agregar sin cuenta, agregarlo ahora
    const prodPendiente = this.carritoService.consumirProductoPendiente();
    if (prodPendiente) {
      setTimeout(() => {
        this.carritoService.agregar(prodPendiente);
        this.carritoService.abrirOffcanvas();
      }, 300);
      return;
    }

    // Si el usuario estaba intentando proceder al pago, abrir checkout directamente
    if (this.carritoService.consumirCompraPendiente()) {
      setTimeout(() => {
        this.carritoService.abrirCheckout();
      }, 300);
    }
  }
}
