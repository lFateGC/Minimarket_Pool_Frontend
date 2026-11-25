import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Rol, Usuario } from '../../../core/models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="usuarios-container">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 class="fw-bold text-dark mb-1">Gestión de Usuarios & Accesos</h4>
          <p class="text-muted small mb-0">Administración de cuentas con roles de Administrador, Cajero (Vendedor) y Clientes Web.</p>
        </div>

        <button class="btn btn-danger fw-bold shadow-sm" (click)="abrirModalNuevo()">
          <i class="bi bi-person-plus-fill me-1"></i> + Nuevo Usuario
        </button>
      </div>

      <!-- Filtro por Pestañas de Roles -->
      <div class="card border-0 rounded-4 shadow-sm bg-white p-3 mb-4">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <ul class="nav nav-pills bg-light rounded-3 p-1">
            <li class="nav-item">
              <button class="nav-link py-1 px-3 fw-bold" [class.active]="filtroRol === 'TODOS'"
                      (click)="cambiarFiltroRol('TODOS')">
                Todos ({{ usuarios.length }})
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link py-1 px-3 fw-bold" [class.active]="filtroRol === 'PERSONAL'"
                      (click)="cambiarFiltroRol('PERSONAL')">
                Personal (Admin / Cajero)
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link py-1 px-3 fw-bold" [class.active]="filtroRol === 'CLIENTES'"
                      (click)="cambiarFiltroRol('CLIENTES')">
                Clientes Web
              </button>
            </li>
          </ul>

          <div class="input-group input-group-sm" style="max-width: 280px;">
            <span class="input-group-text bg-light text-muted"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Buscar por nombre o correo..."
                   [(ngModel)]="busquedaTexto" (keyup)="filtrar()">
          </div>
        </div>
      </div>

      <!-- Tabla de Usuarios -->
      <div class="card border-0 rounded-4 shadow-sm bg-white overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light small">
              <tr>
                <th style="width: 40px;" class="text-center">#</th>
                <th>Nombre del Usuario</th>
                <th>Correo Electrónico</th>
                <th class="text-center">Rol Asignado</th>
                <th class="text-center">Tipo de Cuenta</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="small">
              @if (cargando) {
                <tr><td colspan="6" class="text-center py-4 text-muted">Cargando usuarios...</td></tr>
              } @else if (usuariosFiltrados.length === 0) {
                <tr><td colspan="6" class="text-center py-4 text-muted">No se encontraron usuarios coincidentes.</td></tr>
              } @else {
                @for (u of usuariosFiltrados; track u.id; let idx = $index) {
                  <tr>
                    <td class="text-center text-muted">{{ idx + 1 }}</td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="avatar-circle-sm"
                             [ngClass]="u.rol === 'ADMIN' ? 'bg-danger text-white' : (u.rol === 'VENDEDOR' ? 'bg-warning text-dark' : 'bg-primary text-white')">
                          {{ u.nombre.substring(0, 1) }}
                        </div>
                        <strong class="text-dark">{{ u.nombre }}</strong>
                      </div>
                    </td>
                    <td><code>{{ u.email }}</code></td>
                    <td class="text-center">
                      @if (u.rol === 'ADMIN') {
                        <span class="badge bg-danger">ADMINISTRADOR</span>
                      } @else if (u.rol === 'VENDEDOR') {
                        <span class="badge bg-warning text-dark">VENDEDOR (CAJA)</span>
                      } @else {
                        <span class="badge bg-primary">CLIENTE (TIENDA WEB)</span>
                      }
                    </td>
                    <td class="text-center">
                      @if (u.rol === 'CLIENTE') {
                        <span class="badge bg-light text-primary border">Tienda Virtual</span>
                      } @else {
                        <span class="badge bg-light text-dark border">Personal de Tienda</span>
                      }
                    </td>
                    <td class="text-center">
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" (click)="abrirModalEditar(u)" title="Editar">
                          <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-outline-danger" (click)="eliminar(u)" title="Eliminar">
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

    <!-- MODAL USUARIO (CREAR / EDITAR) -->
    @if (modalVisible) {
      <div class="modal-backdrop fade show" (click)="modalVisible = false"></div>
      <div class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-danger text-white rounded-top-4">
              <h5 class="modal-title fw-bold">
                {{ userEditandoId ? 'Editar Usuario' : 'Registrar Nuevo Usuario' }}
              </h5>
              <button type="button" class="btn-close btn-close-white" (click)="modalVisible = false"></button>
            </div>
            <form (ngSubmit)="guardarUsuario()">
              <div class="modal-body p-4">
                <div class="mb-3">
                  <label class="form-label small fw-bold">Nombre Completo *</label>
                  <input type="text" class="form-control" [(ngModel)]="userForm.nombre" name="nombre" required>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-bold">Correo Electrónico *</label>
                  <input type="email" class="form-control" [(ngModel)]="userForm.email" name="email" required>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-bold">Rol en el Sistema *</label>
                  <select class="form-select" [(ngModel)]="userForm.rol" name="rol" required>
                    <option value="ADMIN">ADMIN (Acceso Total)</option>
                    <option value="VENDEDOR">VENDEDOR (Punto de Venta / Caja)</option>
                    <option value="CLIENTE">CLIENTE (Compras Virtuales)</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-bold">
                    {{ userEditandoId ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso *' }}
                  </label>
                  <input type="password" class="form-control" [(ngModel)]="userPassword" name="password"
                         [placeholder]="userEditandoId ? 'Dejar en blanco para conservar actual' : 'Mínimo 6 caracteres'"
                         [required]="!userEditandoId">
                </div>
              </div>
              <div class="modal-footer bg-light border-0 rounded-bottom-4">
                <button type="button" class="btn btn-secondary" (click)="modalVisible = false">Cancelar</button>
                <button type="submit" class="btn btn-danger fw-bold" [disabled]="guardando">
                  {{ guardando ? 'Guardando...' : 'Guardar Usuario' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .avatar-circle-sm {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }
  `]
})
export class UsuariosComponent implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  filtroRol: 'TODOS' | 'PERSONAL' | 'CLIENTES' = 'TODOS';
  busquedaTexto = '';
  cargando = false;

  modalVisible = false;
  userEditandoId: number | null = null;
  userForm: Partial<Usuario> = { rol: 'VENDEDOR' };
  userPassword = '';
  guardando = false;

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando = true;
    this.authService.listarUsuarios().subscribe({
      next: lista => {
        this.usuarios = lista;
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

  cambiarFiltroRol(f: 'TODOS' | 'PERSONAL' | 'CLIENTES') {
    this.filtroRol = f;
    this.filtrar();
  }

  filtrar() {
    const q = this.busquedaTexto.toLowerCase().trim();

    this.usuariosFiltrados = this.usuarios.filter(u => {
      const matchQ = !q || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);

      let matchRol = true;
      if (this.filtroRol === 'PERSONAL') matchRol = (u.rol === 'ADMIN' || u.rol === 'VENDEDOR');
      if (this.filtroRol === 'CLIENTES') matchRol = (u.rol === 'CLIENTE');

      return matchQ && matchRol;
    });
  }

  abrirModalNuevo() {
    this.userEditandoId = null;
    this.userForm = { rol: 'VENDEDOR', nombre: '', email: '' };
    this.userPassword = '';
    this.modalVisible = true;
  }

  abrirModalEditar(u: Usuario) {
    this.userEditandoId = u.id;
    this.userForm = { ...u };
    this.userPassword = '';
    this.modalVisible = true;
  }

  guardarUsuario() {
    this.guardando = true;
    if (this.userEditandoId) {
      const payload: any = {
        nombre: this.userForm.nombre,
        email: this.userForm.email,
        rol: this.userForm.rol
      };
      if (this.userPassword.trim()) {
        payload.password = this.userPassword.trim();
      }

      this.authService.actualizarUsuario(this.userEditandoId, payload).subscribe({
        next: () => {
          this.guardando = false;
          this.modalVisible = false;
          this.toastService.success('Actualizado', 'Usuario modificado exitosamente.');
          this.cargarDatos();
        },
        error: err => {
          this.guardando = false;
          this.toastService.error('Error', err.error?.mensaje || 'No se pudo actualizar.');
        }
      });
    } else {
      this.authService.registrarPersonal({
        nombre: this.userForm.nombre || '',
        email: this.userForm.email || '',
        password: this.userPassword
      }).subscribe({
        next: () => {
          this.guardando = false;
          this.modalVisible = false;
          this.toastService.success('Registrado', 'Usuario creado en el sistema.');
          this.cargarDatos();
        },
        error: err => {
          this.guardando = false;
          this.toastService.error('Error', err.error?.mensaje || 'No se pudo registrar.');
        }
      });
    }
  }

  eliminar(u: Usuario) {
    if (confirm(`¿Eliminar usuario "${u.nombre}" (${u.email})?`)) {
      this.authService.eliminarUsuario(u.id).subscribe({
        next: () => {
          this.toastService.info('Eliminado', 'Usuario retirado.');
          this.cargarDatos();
        },
        error: err => this.toastService.error('Error', err.error?.mensaje || 'No se pudo eliminar.')
      });
    }
  }
}
