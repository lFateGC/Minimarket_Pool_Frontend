import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedorService } from '../../../core/services/proveedor.service';
import { ToastService } from '../../../core/services/toast.service';
import { Proveedor } from '../../../core/models';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="proveedores-container">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 class="fw-bold text-dark mb-1">Proveedores & Distribuidoras</h4>
          <p class="text-muted small mb-0">Gestión de empresas proveedoras de abarrotes, bebidas y mercadería general.</p>
        </div>

        <button class="btn btn-danger fw-bold shadow-sm" (click)="abrirModalNuevo()">
          <i class="bi bi-plus-lg me-1"></i> + Registrar Proveedor
        </button>
      </div>

      <!-- Tabla de Proveedores -->
      <div class="card border-0 rounded-4 shadow-sm bg-white overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light small">
              <tr>
                <th style="width: 40px;" class="text-center">#</th>
                <th>RUC</th>
                <th>Razón Social</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="small">
              @if (cargando) {
                <tr><td colspan="8" class="text-center py-4 text-muted">Cargando proveedores...</td></tr>
              } @else if (proveedores.length === 0) {
                <tr><td colspan="8" class="text-center py-4 text-muted">No hay proveedores registrados.</td></tr>
              } @else {
                @for (p of proveedores; track p.id; let idx = $index) {
                  <tr>
                    <td class="text-center text-muted">{{ idx + 1 }}</td>
                    <td><code>{{ p.ruc }}</code></td>
                    <td><strong class="text-dark">{{ p.razonSocial }}</strong></td>
                    <td>{{ p.contacto || '-' }}</td>
                    <td>{{ p.telefono || '-' }}</td>
                    <td>{{ p.email || '-' }}</td>
                    <td><small class="text-muted">{{ p.direccion || '-' }}</small></td>
                    <td class="text-center">
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" (click)="abrirModalEditar(p)" title="Editar">
                          <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-outline-danger" (click)="eliminar(p)" title="Eliminar">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL PROVEEDOR -->
    @if (modalVisible) {
      <div class="modal-backdrop fade show" (click)="modalVisible = false"></div>
      <div class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-danger text-white rounded-top-4">
              <h5 class="modal-title fw-bold">
                {{ provEditandoId ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor' }}
              </h5>
              <button type="button" class="btn-close btn-close-white" (click)="modalVisible = false"></button>
            </div>
            <form (ngSubmit)="guardarProveedor()">
              <div class="modal-body p-4">
                <div class="row g-3">
                  <div class="col-6">
                    <label class="form-label small fw-bold">RUC *</label>
                    <input type="text" class="form-control" [(ngModel)]="provForm.ruc" name="ruc" maxlength="11" required>
                  </div>
                  <div class="col-6">
                    <label class="form-label small fw-bold">Teléfono</label>
                    <input type="tel" class="form-control" [(ngModel)]="provForm.telefono" name="telefono">
                  </div>
                  <div class="col-12">
                    <label class="form-label small fw-bold">Razón Social *</label>
                    <input type="text" class="form-control" [(ngModel)]="provForm.razonSocial" name="razonSocial" required>
                  </div>
                  <div class="col-12">
                    <label class="form-label small fw-bold">Contacto / Vendedor</label>
                    <input type="text" class="form-control" [(ngModel)]="provForm.contacto" name="contacto">
                  </div>
                  <div class="col-12">
                    <label class="form-label small fw-bold">Correo Electrónico</label>
                    <input type="email" class="form-control" [(ngModel)]="provForm.email" name="email">
                  </div>
                  <div class="col-12">
                    <label class="form-label small fw-bold">Dirección Fiscal / Almacén</label>
                    <input type="text" class="form-control" [(ngModel)]="provForm.direccion" name="direccion">
                  </div>
                </div>
              </div>
              <div class="modal-footer bg-light border-0 rounded-bottom-4">
                <button type="button" class="btn btn-secondary" (click)="modalVisible = false">Cancelar</button>
                <button type="submit" class="btn btn-danger fw-bold" [disabled]="guardando">
                  {{ guardando ? 'Guardando...' : 'Guardar Proveedor' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class ProveedoresComponent implements OnInit {
  private proveedorService = inject(ProveedorService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  proveedores: Proveedor[] = [];
  cargando = false;

  modalVisible = false;
  provEditandoId: number | null = null;
  provForm: Partial<Proveedor> = { activo: true };
  guardando = false;

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando = true;
    this.proveedorService.listar().subscribe({
      next: lista => {
        this.proveedores = lista;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  abrirModalNuevo() {
    this.provEditandoId = null;
    this.provForm = { activo: true };
    this.modalVisible = true;
  }

  abrirModalEditar(p: Proveedor) {
    this.provEditandoId = p.id;
    this.provForm = { ...p };
    this.modalVisible = true;
  }

  guardarProveedor() {
    this.guardando = true;
    if (this.provEditandoId) {
      this.proveedorService.actualizar(this.provEditandoId, this.provForm).subscribe({
        next: () => {
          this.guardando = false;
          this.modalVisible = false;
          this.toastService.success('Actualizado', 'Proveedor actualizado.');
          this.cargarDatos();
        },
        error: err => {
          this.guardando = false;
          this.toastService.error('Error', err.error?.mensaje || 'No se pudo actualizar.');
        }
      });
    } else {
      this.proveedorService.crear(this.provForm).subscribe({
        next: () => {
          this.guardando = false;
          this.modalVisible = false;
          this.toastService.success('Registrado', 'Proveedor creado.');
          this.cargarDatos();
        },
        error: err => {
          this.guardando = false;
          this.toastService.error('Error', err.error?.mensaje || 'No se pudo registrar.');
        }
      });
    }
  }

  eliminar(p: Proveedor) {
    if (confirm(`¿Eliminar proveedor "${p.razonSocial}"?`)) {
      this.proveedorService.eliminar(p.id).subscribe({
        next: () => {
          this.toastService.info('Eliminado', 'Proveedor retirado.');
          this.cargarDatos();
        },
        error: err => this.toastService.error('Error', err.error?.mensaje || 'No se pudo eliminar.')
      });
    }
  }
}
