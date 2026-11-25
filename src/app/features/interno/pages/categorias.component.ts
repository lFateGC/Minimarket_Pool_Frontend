import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../core/services/producto.service';
import { ToastService } from '../../../core/services/toast.service';
import { Categoria } from '../../../core/models';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="categorias-container">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 class="fw-bold text-dark mb-1">Categorías de Productos</h4>
          <p class="text-muted small mb-0">Organización y clasificación del catálogo (Abarrotes, Bebidas, Lácteos, etc.).</p>
        </div>

        <button class="btn btn-danger fw-bold shadow-sm" (click)="abrirModalNuevo()">
          <i class="bi bi-plus-lg me-1"></i> + Nueva Categoría
        </button>
      </div>

      <!-- Tabla de Categorías -->
      <div class="card border-0 rounded-4 shadow-sm bg-white overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light small">
              <tr>
                <th style="width: 40px;" class="text-center">#</th>
                <th>Nombre de la Categoría</th>
                <th>Descripción</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="small">
              @if (cargando) {
                <tr><td colspan="4" class="text-center py-4 text-muted">Cargando categorías...</td></tr>
              } @else if (categorias.length === 0) {
                <tr><td colspan="4" class="text-center py-4 text-muted">No hay categorías registradas.</td></tr>
              } @else {
                @for (c of categorias; track c.id; let idx = $index) {
                  <tr>
                    <td class="text-center text-muted">{{ idx + 1 }}</td>
                    <td><strong class="text-dark">{{ c.nombre }}</strong></td>
                    <td>{{ c.descripcion || 'Sin descripción' }}</td>
                    <td class="text-center">
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" (click)="abrirModalEditar(c)" title="Editar">
                          <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-outline-danger" (click)="eliminar(c)" title="Eliminar">
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

    <!-- MODAL CATEGORÍA -->
    @if (modalVisible) {
      <div class="modal-backdrop fade show" (click)="modalVisible = false"></div>
      <div class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-danger text-white rounded-top-4">
              <h5 class="modal-title fw-bold">
                {{ catEditandoId ? 'Editar Categoría' : 'Nueva Categoría' }}
              </h5>
              <button type="button" class="btn-close btn-close-white" (click)="modalVisible = false"></button>
            </div>
            <form (ngSubmit)="guardarCategoria()">
              <div class="modal-body p-4">
                <div class="mb-3">
                  <label class="form-label small fw-bold">Nombre de la Categoría *</label>
                  <input type="text" class="form-control" [(ngModel)]="catForm.nombre" name="nombre" required>
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-bold">Descripción</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="catForm.descripcion" name="descripcion"></textarea>
                </div>
              </div>
              <div class="modal-footer bg-light border-0 rounded-bottom-4">
                <button type="button" class="btn btn-secondary" (click)="modalVisible = false">Cancelar</button>
                <button type="submit" class="btn btn-danger fw-bold" [disabled]="guardando">
                  {{ guardando ? 'Guardando...' : 'Guardar Categoría' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class CategoriasComponent implements OnInit {
  private productoService = inject(ProductoService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  categorias: Categoria[] = [];
  cargando = false;

  modalVisible = false;
  catEditandoId: number | null = null;
  catForm: Partial<Categoria> = { activo: true };
  guardando = false;

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando = true;
    this.productoService.listarCategorias().subscribe({
      next: lista => {
        this.categorias = lista;
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
    this.catEditandoId = null;
    this.catForm = { activo: true };
    this.modalVisible = true;
  }

  abrirModalEditar(c: Categoria) {
    this.catEditandoId = c.id;
    this.catForm = { ...c };
    this.modalVisible = true;
  }

  guardarCategoria() {
    this.guardando = true;
    if (this.catEditandoId) {
      this.productoService.actualizarCategoria(this.catEditandoId, this.catForm).subscribe({
        next: () => {
          this.guardando = false;
          this.modalVisible = false;
          this.toastService.success('Actualizada', 'Categoría modificada.');
          this.cargarDatos();
        },
        error: err => {
          this.guardando = false;
          this.toastService.error('Error', err.error?.mensaje || 'No se pudo actualizar.');
        }
      });
    } else {
      this.productoService.crearCategoria(this.catForm).subscribe({
        next: () => {
          this.guardando = false;
          this.modalVisible = false;
          this.toastService.success('Registrada', 'Categoría creada.');
          this.cargarDatos();
        },
        error: err => {
          this.guardando = false;
          this.toastService.error('Error', err.error?.mensaje || 'No se pudo registrar.');
        }
      });
    }
  }

  eliminar(c: Categoria) {
    if (confirm(`¿Eliminar la categoría "${c.nombre}"?`)) {
      this.productoService.eliminarCategoria(c.id).subscribe({
        next: () => {
          this.toastService.info('Eliminada', 'Categoría retirada.');
          this.cargarDatos();
        },
        error: err => this.toastService.error('Error', err.error?.mensaje || 'No se pudo eliminar.')
      });
    }
  }
}
