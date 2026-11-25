import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../../core/services/cliente.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Cliente } from '../../../core/models';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="clientes-container">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 class="fw-bold text-dark mb-1">Directorio de Clientes</h4>
          <p class="text-muted small mb-0">Gestión de clientes presenciales de tienda física y usuarios registrados en la tienda virtual.</p>
        </div>

        <button class="btn btn-danger fw-bold shadow-sm" (click)="abrirModalNuevo()">
          <i class="bi bi-person-plus-fill me-1"></i> + Registrar Cliente
        </button>
      </div>

      <!-- Barra de Filtros -->
      <div class="card border-0 rounded-4 shadow-sm bg-white p-3 mb-4">
        <div class="row g-2 align-items-center">
          <div class="col-md-6">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light text-muted"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" placeholder="Buscar por DNI, RUC o Nombre..."
                     [(ngModel)]="filtroTexto" (keyup)="filtrar()">
            </div>
          </div>
          <div class="col-md-3">
            <select class="form-select form-select-sm" [(ngModel)]="filtroCanal" (change)="filtrar()">
              <option value="">Todos los Canales</option>
              <option value="WEB">Web + Tienda</option>
              <option value="TIENDA">Solo Tienda Física</option>
            </select>
          </div>
          <div class="col-md-3 text-end">
            <span class="badge bg-light text-dark border p-2 fw-semibold">
              Total: {{ clientesFiltrados.length }} clientes
            </span>
          </div>
        </div>
      </div>

      <!-- Tabla de Clientes -->
      <div class="card border-0 rounded-4 shadow-sm bg-white overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light small">
              <tr>
                <th style="width: 40px;" class="text-center">#</th>
                <th>Tipo</th>
                <th>N° Documento</th>
                <th>Nombres / Razón Social</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th class="text-center">Canal / Cuenta</th>
                <th class="text-center">Historial</th>
                <th class="text-center">Estado</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="small">
              @if (cargando) {
                <tr><td colspan="10" class="text-center py-4 text-muted">Cargando directorio de clientes...</td></tr>
              } @else if (clientesFiltrados.length === 0) {
                <tr><td colspan="10" class="text-center py-4 text-muted">No se encontraron clientes registrados.</td></tr>
              } @else {
                @for (c of clientesFiltrados; track c.id; let idx = $index) {
                  <tr>
                    <td class="text-center text-muted">{{ idx + 1 }}</td>
                    <td>
                      <span class="badge" [ngClass]="c.tipoDocumento === 'RUC' ? 'bg-primary-subtle text-primary border' : 'bg-secondary-subtle text-dark border'">
                        {{ c.tipoDocumento }}
                      </span>
                    </td>
                    <td><code class="fw-bold fs-6 text-dark">{{ c.numeroDocumento }}</code></td>
                    <td>
                      <strong class="text-dark d-block">{{ c.nombreCompleto || c.nombres + ' ' + (c.apellidos || '') }}</strong>
                      <small class="text-muted"><i class="bi bi-geo-alt me-1"></i>{{ c.direccion || 'Sin dirección' }}</small>
                    </td>
                    <td>{{ c.telefono || '-' }}</td>
                    <td>{{ c.email || '-' }}</td>
                    <td class="text-center">
                      @if (c.tieneCuentaWeb) {
                        <span class="badge bg-primary-subtle text-primary border border-primary-subtle" title="Cuenta con usuario web para compras online">
                          <i class="bi bi-globe me-1"></i>Web + Tienda
                        </span>
                      } @else {
                        <span class="badge bg-secondary-subtle text-secondary border" title="Cliente registrado en caja física (sin cuenta web todavía)">
                          <i class="bi bi-shop me-1"></i>Solo Tienda
                        </span>
                      }
                    </td>
                    <td class="text-center">
                      <span class="badge bg-light text-dark border fw-bold">{{ c.totalCompras || 0 }} compras</span>
                    </td>
                    <td class="text-center">
                      <span class="badge" [ngClass]="c.activo ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger'">
                        {{ c.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="text-center">
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" (click)="abrirModalEditar(c)" title="Editar">
                          <i class="bi bi-pencil-square"></i>
                        </button>
                        @if (authService.isAdmin()) {
                          <button class="btn btn-outline-danger" (click)="eliminar(c)" title="Eliminar">
                            <i class="bi bi-trash"></i>
                          </button>
                        }
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

    <!-- MODAL CLIENTE (CREAR / EDITAR) -->
    @if (modalVisible) {
      <div class="modal-backdrop fade show" (click)="modalVisible = false"></div>
      <div class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-danger text-white rounded-top-4">
              <h5 class="modal-title fw-bold">
                {{ clienteEditandoId ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente' }}
              </h5>
              <button type="button" class="btn-close btn-close-white" (click)="modalVisible = false"></button>
            </div>
            <form (ngSubmit)="guardarCliente()">
              <div class="modal-body p-4">
                <div class="row g-3">
                  <div class="col-4">
                    <label class="form-label small fw-bold">Tipo Doc. *</label>
                    <select class="form-select" [(ngModel)]="clienteForm.tipoDocumento" name="tipoDocumento">
                      <option value="DNI">DNI</option>
                      <option value="RUC">RUC</option>
                      <option value="CE">C.E.</option>
                    </select>
                  </div>
                  <div class="col-8">
                    <label class="form-label small fw-bold">N° Documento *</label>
                    <input type="text" class="form-control" [(ngModel)]="clienteForm.numeroDocumento" name="numeroDocumento"
                           [maxLength]="clienteForm.tipoDocumento === 'DNI' ? 8 : 11" required>
                  </div>

                  <div class="col-12">
                    <label class="form-label small fw-bold">Nombres / Razón Social *</label>
                    <input type="text" class="form-control" [(ngModel)]="clienteForm.nombres" name="nombres" required>
                  </div>

                  @if (clienteForm.tipoDocumento !== 'RUC') {
                    <div class="col-12">
                      <label class="form-label small fw-bold">Apellidos</label>
                      <input type="text" class="form-control" [(ngModel)]="clienteForm.apellidos" name="apellidos">
                    </div>
                  }

                  <div class="col-12">
                    <label class="form-label small fw-bold">Teléfono / WhatsApp</label>
                    <input type="tel" class="form-control" [(ngModel)]="clienteForm.telefono" name="telefono">
                  </div>

                  <div class="col-12">
                    <label class="form-label small fw-bold">Correo Electrónico</label>
                    <input type="email" class="form-control" [(ngModel)]="clienteForm.email" name="email">
                  </div>

                  <div class="col-12">
                    <label class="form-label small fw-bold">Dirección de Entrega</label>
                    <input type="text" class="form-control" [(ngModel)]="clienteForm.direccion" name="direccion">
                  </div>
                </div>
              </div>
              <div class="modal-footer bg-light border-0 rounded-bottom-4">
                <button type="button" class="btn btn-secondary" (click)="modalVisible = false">Cancelar</button>
                <button type="submit" class="btn btn-danger fw-bold" [disabled]="guardando">
                  {{ guardando ? 'Guardando...' : 'Guardar Cliente' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class ClientesComponent implements OnInit {
  private clienteService = inject(ClienteService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  filtroTexto = '';
  filtroCanal = '';
  cargando = false;

  modalVisible = false;
  clienteEditandoId: number | null = null;
  clienteForm: Partial<Cliente> = { tipoDocumento: 'DNI', activo: true };
  guardando = false;

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando = true;
    this.clienteService.listar().subscribe({
      next: lista => {
        this.clientes = lista;
        this.filtrar();
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  filtrar() {
    const q = this.filtroTexto.toLowerCase().trim();
    const canal = this.filtroCanal;

    this.clientesFiltrados = this.clientes.filter(c => {
      const nom = (c.nombreCompleto || `${c.nombres} ${c.apellidos || ''}`).toLowerCase();
      const doc = (c.numeroDocumento || '').toLowerCase();
      const matchQ = !q || nom.includes(q) || doc.includes(q);

      let matchCanal = true;
      if (canal === 'WEB') matchCanal = !!c.tieneCuentaWeb;
      if (canal === 'TIENDA') matchCanal = !c.tieneCuentaWeb;

      return matchQ && matchCanal;
    });
  }

  abrirModalNuevo() {
    this.clienteEditandoId = null;
    this.clienteForm = { tipoDocumento: 'DNI', activo: true };
    this.modalVisible = true;
  }

  abrirModalEditar(c: Cliente) {
    this.clienteEditandoId = c.id;
    this.clienteForm = { ...c };
    this.modalVisible = true;
  }

  guardarCliente() {
    this.guardando = true;
    if (this.clienteEditandoId) {
      this.clienteService.actualizar(this.clienteEditandoId, this.clienteForm).subscribe({
        next: () => {
          this.guardando = false;
          this.modalVisible = false;
          this.toastService.success('Actualizado', 'Cliente actualizado exitosamente.');
          this.cargarDatos();
        },
        error: err => {
          this.guardando = false;
          this.toastService.error('Error', err.error?.mensaje || 'No se pudo actualizar.');
        }
      });
    } else {
      this.clienteService.crear(this.clienteForm).subscribe({
        next: () => {
          this.guardando = false;
          this.modalVisible = false;
          this.toastService.success('Registrado', 'Cliente registrado.');
          this.cargarDatos();
        },
        error: err => {
          this.guardando = false;
          this.toastService.error('Error', err.error?.mensaje || 'No se pudo registrar.');
        }
      });
    }
  }

  eliminar(c: Cliente) {
    if (confirm(`¿Desactivar o eliminar cliente ${c.nombres}?`)) {
      this.clienteService.eliminar(c.id).subscribe({
        next: () => {
          this.toastService.info('Eliminado', 'Cliente procesado.');
          this.cargarDatos();
        },
        error: err => this.toastService.error('Error', err.error?.mensaje || 'No se pudo eliminar.')
      });
    }
  }
}
