import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoginRequest } from '../../../core/models';

@Component({
  selector: 'app-login-interno',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-wrapper min-vh-100 d-flex align-items-center justify-content-center p-3">
      <div class="card border-0 rounded-4 shadow-lg overflow-hidden" style="max-width: 440px; width: 100%;">
        <!-- Header Rojo Corporativo -->
        <div class="bg-danger text-white text-center py-4 px-3 position-relative">
          <div class="d-inline-flex align-items-center justify-content-center brand-logo-box mx-auto mb-2 shadow-sm">
            <i class="bi bi-cart4 text-dark fs-2"></i>
          </div>
          <h4 class="fw-bold mb-1">MINIMARKET POOL</h4>
          <span class="badge bg-warning text-dark px-3 py-1 fw-bold rounded-pill">
            <i class="bi bi-shield-lock-fill me-1"></i> Portal Interno de Tienda
          </span>
          <p class="small text-white-50 mt-2 mb-0">Acceso exclusivo para Administradores y Cajeros / Vendedores</p>
        </div>

        <!-- Formulario -->
        <div class="card-body p-4">
          <form (ngSubmit)="iniciarSesion()">
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted">Correo Corporativo</label>
              <div class="input-group">
                <span class="input-group-text bg-light text-muted"><i class="bi bi-envelope-fill"></i></span>
                <input type="email" class="form-control" [(ngModel)]="credenciales.email" name="email"
                       placeholder="admin@minimarket.com" required>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label small fw-bold text-muted">Contraseña</label>
              <div class="input-group">
                <span class="input-group-text bg-light text-muted"><i class="bi bi-key-fill"></i></span>
                <input type="password" class="form-control" [(ngModel)]="credenciales.password" name="password"
                       placeholder="••••••••" required>
              </div>
            </div>

            <button type="submit" class="btn btn-danger w-100 py-2 fw-bold shadow-sm" [disabled]="cargando">
              @if (cargando) {
                <span class="spinner-border spinner-border-sm me-2"></span> Verificando Acceso...
              } @else {
                <i class="bi bi-box-arrow-in-right me-2"></i> Ingresar al Sistema
              }
            </button>
          </form>

          <!-- Accesos Rápidos de Prueba -->
          <div class="mt-4 pt-3 border-top">
            <div class="small text-muted fw-bold mb-2 text-center">Acceso Rápido de Prueba:</div>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-sm btn-outline-secondary w-50 py-1"
                      (click)="llenarCredenciales('admin@minimarket.com', '123456')">
                <i class="bi bi-person-fill-gear me-1"></i> Admin
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary w-50 py-1"
                      (click)="llenarCredenciales('vendedor@minimarket.com', '123456')">
                <i class="bi bi-person-badge me-1"></i> Cajero
              </button>
            </div>
          </div>

          <div class="text-center mt-3">
            <a routerLink="/tienda" class="text-decoration-none small text-muted">
              <i class="bi bi-arrow-left me-1"></i> Ir a la Tienda Virtual (Clientes)
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
    }
    .brand-logo-box {
      width: 52px;
      height: 52px;
      background: #fbbf24;
      border-radius: 12px;
    }
  `]
})
export class LoginInternoComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  credenciales: LoginRequest = { email: '', password: '' };
  cargando = false;

  llenarCredenciales(email: string, pass: string) {
    this.credenciales.email = email;
    this.credenciales.password = pass;
  }

  iniciarSesion() {
    if (!this.credenciales.email || !this.credenciales.password) {
      this.toastService.warning('Campos Requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    this.cargando = true;
    this.authService.login(this.credenciales).subscribe({
      next: res => {
        this.cargando = false;
        if (res.rol === 'CLIENTE') {
          this.toastService.warning('Acceso Restringido', 'Esta cuenta es de Cliente. Por favor ingresa desde la Tienda Virtual.');
          this.authService.logout('/tienda');
          return;
        }

        this.toastService.success('Bienvenido', `Hola ${res.nombre} (${res.rol})`);
        this.router.navigate(['/interno/dashboard']);
      },
      error: err => {
        this.cargando = false;
        this.toastService.error('Error de Acceso', err.error?.mensaje || 'Credenciales no válidas.');
      }
    });
  }
}
