import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../core/services/producto.service';
import { ProveedorService } from '../../../core/services/proveedor.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Categoria, Producto, Proveedor } from '../../../core/models';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="catalogo-container">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 class="fw-bold text-dark mb-1">Catálogo Maestro de Productos</h4>
          <p class="text-muted small mb-0">Gestión de artículos, precios de venta, stock mínimo y fotografías.</p>
        </div>

        @if (authService.isAdmin()) {
          <button class="btn btn-danger fw-bold shadow-sm" (click)="abrirModalNuevo()">
            <i class="bi bi-plus-lg me-1"></i> + Nuevo Producto
          </button>
        }
      </div>

      <!-- Filtros -->
      <div class="card border-0 rounded-4 shadow-sm bg-white p-3 mb-4">
        <div class="row g-2">
          <div class="col-md-5">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light text-muted"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" placeholder="Buscar por nombre o SKU..."
                     [(ngModel)]="filtroTexto" (keyup)="filtrar()">
            </div>
          </div>
          <div class="col-md-4">
            <select class="form-select form-select-sm" [(ngModel)]="filtroCat" (change)="filtrar()">
              <option value="">Todas las Categorías</option>
              @for (cat of categorias; track cat.id) {
                <option [value]="cat.nombre">{{ cat.nombre }}</option>
              }
            </select>
          </div>
          <div class="col-md-3 text-end">
            <span class="badge bg-light text-dark border p-2 fw-semibold">
              Total: {{ productosFiltrados.length }} productos
            </span>
          </div>
        </div>
      </div>

      <!-- Tabla de Productos -->
      <div class="card border-0 rounded-4 shadow-sm bg-white overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light small">
              <tr>
                <th style="width: 50px;">Foto</th>
                <th>SKU</th>
                <th>Nombre del Producto</th>
                <th>Categoría</th>
                <th>Proveedor</th>
                <th class="text-end">P. Unitario</th>
                <th class="text-center">Stock Actual</th>
                @if (authService.isAdmin()) {
                  <th class="text-center">Acciones</th>
                }
              </tr>
            </thead>
            <tbody class="small">
              @if (cargando) {
                <tr><td colspan="8" class="text-center py-4 text-muted">Cargando catálogo...</td></tr>
              } @else if (productosFiltrados.length === 0) {
                <tr><td colspan="8" class="text-center py-4 text-muted">No se encontraron productos.</td></tr>
              } @else {
                @for (p of productosFiltrados; track p.id) {
                  <tr>
                    <td>
                      <img [src]="p.imagenUrl || 'https://placehold.co/60x60/f8fafc/94a3b8?text=P'"
                           [alt]="p.nombre" class="rounded border" style="width: 44px; height: 44px; object-fit: cover;"
                           onerror="this.src='https://placehold.co/60x60/f8fafc/94a3b8?text=P'">
                    </td>
                    <td><code>{{ p.sku }}</code></td>
                    <td>
                      <strong class="text-dark d-block">{{ p.nombre }}</strong>
                      <small class="text-muted">{{ p.descripcion || 'Sin descripción' }}</small>
                    </td>
                    <td><span class="badge bg-light text-dark border">{{ p.categoriaNombre || 'General' }}</span></td>
                    <td><small class="text-muted">{{ p.proveedorNombre || '-' }}</small></td>
                    <td class="text-end fw-bold text-danger">S/ {{ p.precioUnitario | number:'1.2-2' }}</td>
                    <td class="text-center">
                      <span class="badge" [ngClass]="p.stockActual <= 0 ? 'bg-danger' : (p.stockActual <= (p.stockMinimo || 5) ? 'bg-warning text-dark' : 'bg-success')">
                        {{ p.stockActual }} unid.
                      </span>
                    </td>
                    @if (authService.isAdmin()) {
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
                    }
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL PRODUCTO (CREAR / EDITAR) -->
    @if (modalVisible) {
      <div class="modal-backdrop fade show" (click)="modalVisible = false"></div>
      <div class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-danger text-white rounded-top-4">
              <h5 class="modal-title fw-bold">
                {{ prodEditandoId ? 'Editar Producto' : 'Registrar Nuevo Producto' }}
              </h5>
              <button type="button" class="btn-close btn-close-white" (click)="modalVisible = false"></button>
            </div>
            <form (ngSubmit)="guardarProducto()">
              <div class="modal-body p-4">
                <div class="row g-3">
                  <div class="col-md-8">
                    <label class="form-label small fw-bold">Nombre del Producto *</label>
                    <input type="text" class="form-control" [(ngModel)]="prodForm.nombre" name="nombre" required>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label small fw-bold">SKU / Código de Barras *</label>
                    <input type="text" class="form-control" [(ngModel)]="prodForm.sku" name="sku" required>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label small fw-bold">Categoría *</label>
                    <select class="form-select" [(ngModel)]="prodForm.categoriaId" name="categoriaId" required>
                      <option [ngValue]="null">Seleccione una categoría</option>
                      @for (cat of categorias; track cat.id) {
                        <option [ngValue]="cat.id">{{ cat.nombre }}</option>
                      }
                    </select>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label small fw-bold">Proveedor</label>
                    <select class="form-select" [(ngModel)]="prodForm.proveedorId" name="proveedorId">
                      <option [ngValue]="null">Seleccione proveedor</option>
                      @for (pr of proveedores; track pr.id) {
                        <option [ngValue]="pr.id">{{ pr.razonSocial }}</option>
                      }
                    </select>
                  </div>

                  <div class="col-md-4">
                    <label class="form-label small fw-bold">Precio Unitario Venta (S/) *</label>
                    <input type="number" step="0.1" class="form-control" [(ngModel)]="prodForm.precioUnitario" name="precioUnitario" required>
                  </div>

                  <div class="col-md-4">
                    <label class="form-label small fw-bold">Precio Compra (S/)</label>
                    <input type="number" step="0.1" class="form-control" [(ngModel)]="prodForm.precioCompra" name="precioCompra">
                  </div>

                  <div class="col-md-4">
                    <label class="form-label small fw-bold">Stock Mínimo Alerta</label>
                    <input type="number" class="form-control" [(ngModel)]="prodForm.stockMinimo" name="stockMinimo">
                  </div>

                  <div class="col-12">
                    <label class="form-label small fw-bold">URL de Imagen (Supabase o Externa)</label>
                    <input type="url" class="form-control" [(ngModel)]="prodForm.imagenUrl" name="imagenUrl"
                           placeholder="https://...">
                  </div>

                  <div class="col-12">
                    <label class="form-label small fw-bold">Descripción</label>
                    <textarea class="form-control" rows="2" [(ngModel)]="prodForm.descripcion" name="descripcion"></textarea>
                  </div>
                </div>
              </div>
              <div class="modal-footer bg-light border-0 rounded-bottom-4">
                <button type="button" class="btn btn-secondary" (click)="modalVisible = false">Cancelar</button>
                <button type="submit" class="btn btn-danger fw-bold" [disabled]="guardando">
                  {{ guardando ? 'Guardando...' : 'Guardar Producto' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class CatalogoComponent implements OnInit {
  private productoService = inject(ProductoService);
  private proveedorService = inject(ProveedorService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias: Categoria[] = [];
  proveedores: Proveedor[] = [];

  filtroTexto = '';
  filtroCat = '';
  cargando = false;

  modalVisible = false;
  prodEditandoId: number | null = null;
  prodForm: Partial<Producto> = { stockMinimo: 5 };
  guardando = false;

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando = true;
    this.productoService.listar().subscribe({
      next: prods => {
        this.productos = prods;
        this.filtrar();
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });

    this.productoService.listarCategorias().subscribe({
      next: cats => {
        this.categorias = cats;
        this.cdr.markForCheck();
      },
      error: () => {}
    });

    this.proveedorService.listar().subscribe({
      next: provs => {
        this.proveedores = provs;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  filtrar() {
    const q = this.filtroTexto.toLowerCase().trim();
    const cat = this.filtroCat;

    this.productosFiltrados = this.productos.filter(p => {
      const matchQ = !q || p.nombre.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
      const matchCat = !cat || p.categoriaNombre === cat;
      return matchQ && matchCat;
    });
  }

  abrirModalNuevo() {
    this.prodEditandoId = null;
    this.prodForm = { stockMinimo: 5, precioUnitario: 0 };
    this.modalVisible = true;
  }

  abrirModalEditar(p: Producto) {
    this.prodEditandoId = p.id;
    this.prodForm = { ...p };
    this.modalVisible = true;
  }

  guardarProducto() {
    this.guardando = true;
    if (this.prodEditandoId) {
      this.productoService.actualizar(this.prodEditandoId, this.prodForm).subscribe({
        next: () => {
          this.guardando = false;
          this.modalVisible = false;
          this.toastService.success('Actualizado', 'Producto modificado exitosamente.');
          this.cargarDatos();
        },
        error: err => {
          this.guardando = false;
          this.toastService.error('Error', err.error?.mensaje || 'No se pudo actualizar.');
        }
      });
    } else {
      this.productoService.crear(this.prodForm).subscribe({
        next: () => {
          this.guardando = false;
          this.modalVisible = false;
          this.toastService.success('Registrado', 'Nuevo producto agregado.');
          this.cargarDatos();
        },
        error: err => {
          this.guardando = false;
          this.toastService.error('Error', err.error?.mensaje || 'No se pudo registrar.');
        }
      });
    }
  }

  eliminar(p: Producto) {
    if (confirm(`¿Estás seguro de eliminar el producto "${p.nombre}"?`)) {
      this.productoService.eliminar(p.id).subscribe({
        next: () => {
          this.toastService.info('Eliminado', 'Producto retirado.');
          this.cargarDatos();
        },
        error: err => {
          this.toastService.error('Error', err.error?.mensaje || 'No se pudo eliminar.');
        }
      });
    }
  }
}
