import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ReporteService } from '../../../core/services/reporte.service';
import { CajaService } from '../../../core/services/caja.service';
import { ProductoService } from '../../../core/services/producto.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 class="fw-bold text-dark mb-1">
            Panel de Control — {{ authService.currentUser()?.rol === 'ADMIN' ? 'Administrador' : 'Cajero / Punto de Venta' }}
          </h4>
          <p class="text-muted small mb-0">Resumen operativo de inventario, ventas y alertas en tiempo real.</p>
        </div>

        <div class="d-flex gap-2">
          <a routerLink="/interno/pos" class="btn btn-warning fw-bold text-dark shadow-sm px-3">
            <i class="bi bi-cart-plus-fill me-1"></i> Ir a Punto de Venta (POS)
          </a>
        </div>
      </div>

      <!-- Tarjetas KPIs -->
      <div class="row g-3 mb-4">
        <div class="col-xl-3 col-sm-6">
          <div class="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-muted small fw-bold">VENTAS DEL DÍA</span>
              <div class="kpi-icon bg-success-subtle text-success">
                <i class="bi bi-cash-coin fs-4"></i>
              </div>
            </div>
            <h3 class="fw-bold text-dark mb-0">S/ {{ resumenVentas | number:'1.2-2' }}</h3>
            <small class="text-muted mt-2 d-block">Total recaudado hoy</small>
          </div>
        </div>

        <div class="col-xl-3 col-sm-6">
          <div class="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-muted small fw-bold">PRODUCTOS EN CATÁLOGO</span>
              <div class="kpi-icon bg-primary-subtle text-primary">
                <i class="bi bi-box-seam fs-4"></i>
              </div>
            </div>
            <h3 class="fw-bold text-dark mb-0">{{ totalProductos }}</h3>
            <small class="text-muted mt-2 d-block">Items activos en sistema</small>
          </div>
        </div>

        <div class="col-xl-3 col-sm-6">
          <div class="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-muted small fw-bold">STOCK BAJO / AGOTADO</span>
              <div class="kpi-icon bg-danger-subtle text-danger">
                <i class="bi bi-exclamation-triangle-fill fs-4"></i>
              </div>
            </div>
            <h3 class="fw-bold text-danger mb-0">{{ alertasStockBajo.length }}</h3>
            <small class="text-muted mt-2 d-block">Requieren reabastecimiento</small>
          </div>
        </div>

        <div class="col-xl-3 col-sm-6">
          <div class="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-muted small fw-bold">LOTES POR VENCER</span>
              <div class="kpi-icon bg-warning-subtle text-warning">
                <i class="bi bi-calendar-event fs-4"></i>
              </div>
            </div>
            <h3 class="fw-bold text-warning mb-0">{{ lotesPorVencer.length }}</h3>
            <small class="text-muted mt-2 d-block">Próximos a caducar (FEFO)</small>
          </div>
        </div>
      </div>

      <!-- Alertas y Accesos Rápidos -->
      <div class="row g-4 mb-4">
        <!-- Widget de Alertas de Stock -->
        <div class="col-lg-6">
          <div class="card border-0 rounded-4 shadow-sm bg-white h-100">
            <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <strong class="text-dark">
                <i class="bi bi-exclamation-diamond text-danger me-2"></i> Alertas de Stock Bajo
              </strong>
              <a routerLink="/interno/catalogo" class="btn btn-sm btn-link text-decoration-none">Ver Todos</a>
            </div>
            <div class="card-body p-3">
              @if (alertasStockBajo.length === 0) {
                <div class="text-center py-4 text-success fw-semibold">
                  <i class="bi bi-check-circle-fill fs-3 d-block mb-2"></i>
                  Todos los productos cuentan con stock adecuado.
                </div>
              } @else {
                <div class="list-group list-group-flush">
                  @for (p of alertasStockBajo.slice(0, 5); track p.id) {
                    <div class="list-group-item d-flex justify-content-between align-items-center px-0">
                      <div>
                        <div class="fw-bold small text-dark">{{ p.nombre }}</div>
                        <small class="text-muted">SKU: {{ p.sku }}</small>
                      </div>
                      <span class="badge" [ngClass]="p.stockActual <= 0 ? 'bg-danger' : 'bg-warning text-dark'">
                        {{ p.stockActual }} unid. restantes
                      </span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Accesos Rápidos -->
        <div class="col-lg-6">
          <div class="card border-0 rounded-4 shadow-sm bg-white h-100">
            <div class="card-header bg-white py-3 border-bottom">
              <strong class="text-dark">
                <i class="bi bi-lightning-charge-fill text-warning me-2"></i> Accesos Rápidos de Gestión
              </strong>
            </div>
            <div class="card-body p-3">
              <div class="row g-3">
                <div class="col-sm-6">
                  <a routerLink="/interno/pos" class="btn btn-outline-warning w-100 py-3 text-dark fw-bold text-start shadow-sm d-flex align-items-center gap-2">
                    <i class="bi bi-cart4 fs-3 text-warning"></i>
                    <div>
                      <div>Nueva Venta</div>
                      <small class="text-muted fw-normal">Caja y emisión boletas</small>
                    </div>
                  </a>
                </div>

                <div class="col-sm-6">
                  <a routerLink="/interno/catalogo" class="btn btn-outline-primary w-100 py-3 text-start fw-bold shadow-sm d-flex align-items-center gap-2">
                    <i class="bi bi-box-seam fs-3 text-primary"></i>
                    <div>
                      <div>Catálogo</div>
                      <small class="text-muted fw-normal">Productos y precios</small>
                    </div>
                  </a>
                </div>

                <div class="col-sm-6">
                  <a routerLink="/interno/inventario" class="btn btn-outline-success w-100 py-3 text-start fw-bold shadow-sm d-flex align-items-center gap-2">
                    <i class="bi bi-boxes fs-3 text-success"></i>
                    <div>
                      <div>Lotes & FEFO</div>
                      <small class="text-muted fw-normal">Ingreso y caducidad</small>
                    </div>
                  </a>
                </div>

                <div class="col-sm-6">
                  <a routerLink="/interno/clientes" class="btn btn-outline-info w-100 py-3 text-start fw-bold shadow-sm d-flex align-items-center gap-2">
                    <i class="bi bi-people fs-3 text-info"></i>
                    <div>
                      <div>Clientes</div>
                      <small class="text-muted fw-normal">Directorio y DNI</small>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class DashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private reporteService = inject(ReporteService);
  private productoService = inject(ProductoService);
  private cajaService = inject(CajaService);
  private cdr = inject(ChangeDetectorRef);

  resumenVentas = 0;
  totalProductos = 0;
  alertasStockBajo: any[] = [];
  lotesPorVencer: any[] = [];

  ngOnInit() {
    this.productoService.listar().subscribe({
      next: prods => {
        this.totalProductos = prods.length;
        this.alertasStockBajo = prods.filter(p => p.stockActual <= (p.stockMinimo || 5));
        this.cdr.markForCheck();
      },
      error: () => {}
    });

    this.cajaService.obtenerEstado().subscribe({
      next: est => {
        this.resumenVentas = (est.totalVentasEfectivo || 0) + (est.totalVentasDigital || 0);
        this.cdr.markForCheck();
      },
      error: () => {}
    });

    this.reporteService.porVencer().subscribe({
      next: (lotes: any[]) => {
        this.lotesPorVencer = lotes;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }
}
