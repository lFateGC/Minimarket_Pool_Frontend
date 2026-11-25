import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../../core/services/inventario.service';
import { ProductoService } from '../../../core/services/producto.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoteInventario, Producto } from '../../../core/models';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inventario-container">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 class="fw-bold text-dark mb-1">Control de Inventario & Lotes (FEFO)</h4>
          <p class="text-muted small mb-0">Control estricto de fechas de caducidad: "Primero en Vencer, Primero en Salir".</p>
        </div>

        @if (authService.isAdmin()) {
          <button class="btn btn-success fw-bold shadow-sm" (click)="abrirModalLote()">
            <i class="bi bi-box-arrow-in-down me-1"></i> + Registrar Ingreso de Lote
          </button>
        }
      </div>

      <!-- Tabla de Lotes -->
      <div class="card border-0 rounded-4 shadow-sm bg-white overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light small">
              <tr>
                <th>N° Lote</th>
                <th>Producto</th>
                <th>Fecha Ingreso</th>
                <th>Fecha Vencimiento</th>
                <th class="text-center">Días Restantes</th>
                <th class="text-center">Stock Inicial</th>
                <th class="text-center">Stock Actual</th>
                <th class="text-end">P. Compra Unit</th>
                <th class="text-center">Estado</th>
              </tr>
            </thead>
            <tbody class="small">
              @if (cargando) {
                <tr><td colspan="9" class="text-center py-4 text-muted">Cargando lotes...</td></tr>
              } @else if (lotes.length === 0) {
                <tr><td colspan="9" class="text-center py-4 text-muted">No hay lotes registrados actualmente.</td></tr>
              } @else {
                @for (l of lotes; track l.id) {
                  <tr>
                    <td><code>{{ l.numeroLote }}</code></td>
                    <td><strong class="text-dark">{{ l.productoNombre }}</strong></td>
                    <td>{{ l.fechaIngreso }}</td>
                    <td><strong>{{ l.fechaVencimiento }}</strong></td>
                    <td class="text-center">
                      @let dias = calcularDias(l.fechaVencimiento);
                      @if (dias <= 0) {
                        <span class="badge bg-danger">Vencido</span>
                      } @else if (dias <= 15) {
                        <span class="badge bg-danger">¡{{ dias }} días!</span>
                      } @else if (dias <= 45) {
                        <span class="badge bg-warning text-dark">{{ dias }} días</span>
                      } @else {
                        <span class="badge bg-success">{{ dias }} días</span>
                      }
                    </td>
                    <td class="text-center text-muted">{{ l.cantidadInicial }} u.</td>
                    <td class="text-center fw-bold">{{ l.cantidadActual }} u.</td>
                    <td class="text-end">S/ {{ l.precioCompraUnitario | number:'1.2-2' }}</td>
                    <td class="text-center">
                      <span class="badge" [ngClass]="l.cantidadActual > 0 ? 'bg-success-subtle text-success border' : 'bg-secondary-subtle text-muted'">
                        {{ l.cantidadActual > 0 ? 'Disponible' : 'Agotado' }}
                      </span>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL INGRESO DE LOTE -->
    @if (modalLoteVisible) {
      <div class="modal-backdrop fade show" (click)="modalLoteVisible = false"></div>
      <div class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-success text-white rounded-top-4">
              <h5 class="modal-title fw-bold"><i class="bi bi-box-arrow-in-down me-2"></i> Ingreso de Nuevo Lote</h5>
              <button type="button" class="btn-close btn-close-white" (click)="modalLoteVisible = false"></button>
            </div>
            <form (ngSubmit)="guardarLote()">
              <div class="modal-body p-4">
                <div class="row g-3">
                  <div class="col-12">
                    <label class="form-label small fw-bold">Producto *</label>
                    <select class="form-select" [(ngModel)]="loteForm.productoId" name="productoId" required>
                      <option [ngValue]="null">Seleccione producto</option>
                      @for (p of productos; track p.id) {
                        <option [ngValue]="p.id">{{ p.nombre }} (SKU: {{ p.sku }})</option>
                      }
                    </select>
                  </div>

                  <div class="col-6">
                    <label class="form-label small fw-bold">N° Lote *</label>
                    <input type="text" class="form-control" [(ngModel)]="loteForm.numeroLote" name="numeroLote"
                           placeholder="LT-2026-001" required>
                  </div>

                  <div class="col-6">
                    <label class="form-label small fw-bold">Cantidad Ingresada *</label>
                    <input type="number" class="form-control" [(ngModel)]="loteForm.cantidadInicial" name="cantidadInicial"
                           min="1" required>
                  </div>

                  <div class="col-6">
                    <label class="form-label small fw-bold">Fecha Vencimiento *</label>
                    <input type="date" class="form-control" [(ngModel)]="loteForm.fechaVencimiento" name="fechaVencimiento" required>
                  </div>

                  <div class="col-6">
                    <label class="form-label small fw-bold">P. Compra Unitario (S/) *</label>
                    <input type="number" step="0.1" class="form-control" [(ngModel)]="loteForm.precioCompraUnitario" name="precioCompraUnitario" required>
                  </div>
                </div>
              </div>
              <div class="modal-footer bg-light border-0 rounded-bottom-4">
                <button type="button" class="btn btn-secondary" (click)="modalLoteVisible = false">Cancelar</button>
                <button type="submit" class="btn btn-success fw-bold" [disabled]="guardando">
                  {{ guardando ? 'Registrando...' : 'Registrar Ingreso' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class InventarioComponent implements OnInit {
  private inventarioService = inject(InventarioService);
  private productoService = inject(ProductoService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  lotes: LoteInventario[] = [];
  productos: Producto[] = [];
  cargando = false;

  modalLoteVisible = false;
  loteForm: Partial<LoteInventario> = {};
  guardando = false;

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando = true;
    this.inventarioService.listarLotes().subscribe({
      next: lista => {
        this.lotes = lista;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });

    this.productoService.listar().subscribe({
      next: prods => {
        this.productos = prods;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  calcularDias(fechaVenc: string): number {
    if (!fechaVenc) return 999;
    const hoy = new Date();
    const venc = new Date(fechaVenc);
    const diffMs = venc.getTime() - hoy.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  abrirModalLote() {
    this.loteForm = {
      numeroLote: `LT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      cantidadInicial: 10,
      precioCompraUnitario: 1
    };
    this.modalLoteVisible = true;
  }

  guardarLote() {
    this.guardando = true;
    this.inventarioService.crearLote(this.loteForm).subscribe({
      next: () => {
        this.guardando = false;
        this.modalLoteVisible = false;
        this.toastService.success('Lote Registrado', 'Stock e inventario actualizados.');
        this.cargarDatos();
      },
      error: err => {
        this.guardando = false;
        this.toastService.error('Error', err.error?.mensaje || 'No se pudo registrar el lote.');
      }
    });
  }
}
