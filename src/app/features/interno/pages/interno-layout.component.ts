import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CajaService } from '../../../core/services/caja.service';

@Component({
  selector: 'app-interno-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="armazon-sm position-relative">
      <!-- Backdrop en Pantallas Pequeñas -->
      @if (sidebarAbierto) {
        <div class="sidebar-backdrop d-lg-none" (click)="sidebarAbierto = false"></div>
      }

      <!-- SIDEBAR (Colapsable en móvil/tablet) -->
      <aside class="sidebar-sm d-flex flex-column" [class.abierto]="sidebarAbierto">
        <!-- Logo y Marca -->
        <div class="sidebar-marca-pool d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2">
            <div class="logo-box-amarillo">
              <i class="bi bi-cart4 text-dark fs-4"></i>
            </div>
            <div class="marca-pool-textos">
              <strong class="text-white fs-6">MINIMARKET POOL</strong>
              <small class="text-warning fst-italic" style="font-size: 0.72rem;">Gestión Interna</small>
            </div>
          </div>
          <button class="btn btn-link text-white d-lg-none p-1" (click)="sidebarAbierto = false">
            <i class="bi bi-x-lg fs-5"></i>
          </button>
        </div>

        <!-- Usuario Actual -->
        <div class="p-3 border-bottom bg-light">
          <div class="d-flex align-items-center gap-2">
            <div class="avatar-circle bg-danger text-white fw-bold">
              {{ authService.currentUser()?.nombre?.substring(0, 1) || 'U' }}
            </div>
            <div class="min-w-0">
              <div class="fw-bold small text-dark text-truncate">{{ authService.currentUser()?.nombre }}</div>
              <span class="badge" [ngClass]="authService.isAdmin() ? 'bg-danger' : 'bg-primary'">
                {{ authService.currentUser()?.rol }}
              </span>
            </div>
          </div>
        </div>

        <!-- Menú de Navegación -->
        <div class="sidebar-nav-scroll flex-grow-1 p-2 overflow-auto" (click)="sidebarAbierto = false">
          <div class="sidebar-section-title px-3 pt-2 pb-1 text-uppercase text-muted fw-bold" style="font-size: 0.7rem;">
            Operaciones Principales
          </div>

          <a routerLink="/interno/dashboard" routerLinkActive="active" class="sidebar-link">
            <i class="bi bi-speedometer2 me-2 text-danger"></i> Dashboard
          </a>

          <a routerLink="/interno/pos" routerLinkActive="active" class="sidebar-link sidebar-link-pos">
            <i class="bi bi-cart-check-fill me-2 text-warning"></i> Punto de Venta (POS)
          </a>

          <a routerLink="/interno/catalogo" routerLinkActive="active" class="sidebar-link">
            <i class="bi bi-box-seam me-2 text-primary"></i> Catálogo Maestro
          </a>

          <a routerLink="/interno/inventario" routerLinkActive="active" class="sidebar-link">
            <i class="bi bi-boxes me-2 text-success"></i> Inventario & Lotes
          </a>

          <a routerLink="/interno/clientes" routerLinkActive="active" class="sidebar-link">
            <i class="bi bi-people me-2 text-info"></i> Directorio de Clientes
          </a>

          <a routerLink="/interno/caja" routerLinkActive="active" class="sidebar-link">
            <i class="bi bi-cash-stack me-2 text-warning"></i> Arqueo de Caja
          </a>

          <!-- Sección Exclusiva Administrador -->
          @if (authService.isAdmin()) {
            <div class="sidebar-section-title px-3 pt-3 pb-1 text-uppercase text-muted fw-bold" style="font-size: 0.7rem;">
              Administración
            </div>

            <a routerLink="/interno/proveedores" routerLinkActive="active" class="sidebar-link">
              <i class="bi bi-truck me-2 text-secondary"></i> Proveedores
            </a>

            <a routerLink="/interno/categorias" routerLinkActive="active" class="sidebar-link">
              <i class="bi bi-tags me-2 text-secondary"></i> Categorías
            </a>

            <a routerLink="/interno/reportes" routerLinkActive="active" class="sidebar-link">
              <i class="bi bi-graph-up-arrow me-2 text-success"></i> Reportes & Métricas
            </a>

            <a routerLink="/interno/usuarios" routerLinkActive="active" class="sidebar-link">
              <i class="bi bi-person-gear me-2 text-danger"></i> Gestión de Usuarios
            </a>
          }
        </div>

        <!-- Footer Sidebar -->
        <div class="p-3 border-top bg-light d-flex align-items-center justify-content-between">
          <a routerLink="/tienda" class="btn btn-sm btn-outline-secondary" title="Ver Tienda de Clientes">
            <i class="bi bi-globe me-1"></i> Tienda
          </a>
          <button class="btn btn-sm btn-outline-danger" (click)="authService.logout('/interno/login')" title="Cerrar Sesión">
            <i class="bi bi-box-arrow-right"></i> Salir
          </button>
        </div>
      </aside>

      <!-- CONTENIDO PRINCIPAL -->
      <div class="contenido-sm d-flex flex-column flex-grow-1 min-vh-100">
        <!-- Topbar -->
        <header class="topbar-sm py-2 px-3 px-md-4 bg-white border-bottom d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <!-- Botón Hamburguesa Móvil/Tablet -->
            <button class="btn btn-outline-danger btn-sm d-lg-none" (click)="sidebarAbierto = !sidebarAbierto" title="Abrir Menú">
              <i class="bi bi-list fs-5"></i>
            </button>

            <span class="badge px-3 py-2 fw-semibold text-truncate" style="max-width: 170px;"
                  [ngClass]="cajaAbierta ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'">
              <i class="bi me-1" [ngClass]="cajaAbierta ? 'bi-unlock-fill' : 'bi-lock-fill'"></i>
              {{ cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada' }}
            </span>
          </div>

          <div class="d-flex align-items-center gap-2">
            <small class="text-muted d-none d-md-inline">
              <i class="bi bi-clock me-1"></i> {{ fechaHoraActual }}
            </small>

            <a routerLink="/tienda" class="btn btn-sm btn-outline-danger rounded-pill fw-semibold px-2 px-sm-3">
              <i class="bi bi-shop me-1"></i> <span class="d-none d-sm-inline">Ir a </span>Tienda
            </a>
          </div>
        </header>

        <!-- Vista de la página interna -->
        <main class="p-4 flex-grow-1 overflow-auto bg-light">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .armazon-sm {
      display: flex;
      min-height: 100vh;
    }
    .sidebar-sm {
      width: 260px;
      height: 100vh;
      background: #ffffff;
      border-right: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      flex-shrink: 0;
      z-index: 100;
    }
    .sidebar-marca-pool {
      background: #dc2626;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-box-amarillo {
      width: 42px;
      height: 42px;
      background: #fbbf24;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .avatar-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      flex-shrink: 0;
    }
    .sidebar-link {
      display: flex;
      align-items: center;
      padding: 10px 14px;
      color: #334155;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.88rem;
      border-radius: 8px;
      margin-bottom: 2px;
      transition: all 0.15s ease;
    }
    .sidebar-link:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .sidebar-link.active {
      background: #fee2e2;
      color: #b91c1c;
      font-weight: 700;
    }
    .sidebar-link-pos {
      background: #fef3c7;
      color: #92400e;
      font-weight: 700;
    }
    .sidebar-link-pos:hover {
      background: #fde68a;
      color: #78350f;
    }
    @media (max-width: 991.98px) {
      .sidebar-sm {
        position: fixed !important;
        top: 0;
        left: 0;
        bottom: 0;
        z-index: 1050;
        transform: translateX(-100%);
        transition: transform 0.25s ease-in-out;
        box-shadow: 10px 0 25px rgba(0, 0, 0, 0.2);
      }
      .sidebar-sm.abierto {
        transform: translateX(0);
      }
      .sidebar-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.55);
        z-index: 1045;
        backdrop-filter: blur(2px);
      }
      .contenido-sm main {
        padding: 1rem !important;
      }
    }
  `]
})
export class InternoLayoutComponent implements OnInit {
  public authService = inject(AuthService);
  private cajaService = inject(CajaService);

  sidebarAbierto = false;
  cajaAbierta = false;
  fechaHoraActual = '';

  ngOnInit() {
    this.actualizarFechaHora();
    setInterval(() => this.actualizarFechaHora(), 30000);

    this.cajaService.obtenerEstado().subscribe({
      next: est => this.cajaAbierta = est.cajaAbierta,
      error: () => this.cajaAbierta = false
    });
  }

  private actualizarFechaHora() {
    const ahora = new Date();
    this.fechaHoraActual = ahora.toLocaleDateString('es-PE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
