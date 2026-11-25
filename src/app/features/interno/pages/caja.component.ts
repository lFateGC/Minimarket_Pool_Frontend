import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CajaService } from '../../../core/services/caja.service';
import { ToastService } from '../../../core/services/toast.service';
import { AperturaCajaRequest, CierreCajaRequest, EstadoCajaResponse, MovimientoCajaRequest } from '../../../core/models';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="caja-container">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 class="fw-bold text-dark mb-1">Control & Arqueo de Caja</h4>
          <p class="text-muted small mb-0">Gestión de turnos de caja, registro de efectivo inicial, ingresos, egresos y cierre contable.</p>
        </div>

        <div class="d-flex gap-2">
          @if (!estado?.cajaAbierta) {
            <button class="btn btn-success fw-bold shadow-sm" (click)="modalApertura = true">
              <i class="bi bi-unlock-fill me-1"></i> Abrir Caja / Iniciar Turno
            </button>
          } @else {
            <button class="btn btn-outline-primary fw-bold shadow-sm" (click)="modalMovimiento = true">
              <i class="bi bi-arrow-left-right me-1"></i> Movimiento (Ingreso/Egreso)
            </button>
            <button class="btn btn-danger fw-bold shadow-sm" (click)="abrirModalCierre()">
              <i class="bi bi-lock-fill me-1"></i> Cuadrar & Cerrar Caja
            </button>
          }
        </div>
      </div>

      <!-- Estado Actual de Caja -->
      @if (cargando) {
        <div class="text-center py-5">
          <div class="spinner-border text-danger"></div>
        </div>
      } @else if (estado) {
        <div class="row g-3 mb-4">
          <!-- Tarjeta Principal de Estado -->
          <div class="col-12">
            <div class="card border-0 rounded-4 shadow-sm p-4 text-white"
                 [ngClass]="estado.cajaAbierta ? 'bg-success' : 'bg-secondary'">
              <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <span class="badge bg-white text-dark px-3 py-1 rounded-pill fw-bold mb-2">
                    {{ estado.cajaAbierta ? 'TURNO ACTIVO' : 'CAJA CERRADA' }}
                  </span>
                  <h3 class="fw-bold mb-1">
                    {{ estado.cajaAbierta ? 'Caja Operativa en Punto de Venta' : 'No hay turno abierto actualmente' }}
                  </h3>
                  <small class="opacity-75">
                    Responsable: {{ estado.usuarioNombre || 'Ninguno' }} &nbsp;|&nbsp;
                    Apertura: {{ estado.fechaApertura ? estado.fechaApertura.replace('T', ' ').substring(0, 16) : '-' }}
                  </small>
                </div>

                <div class="text-end">
                  <span class="small opacity-75 d-block">SALDO ESPERADO EN EFECTIVO:</span>
                  <h2 class="display-6 fw-bold mb-0">S/ {{ estado.saldoCalculado || 0 | number:'1.2-2' }}</h2>
                </div>
              </div>
            </div>
          </div>

          <!-- Métricas del Turno -->
          <div class="col-md-3 col-sm-6">
            <div class="card border-0 rounded-4 shadow-sm bg-white p-3">
              <span class="text-muted small fw-bold">MONTO APERTURA</span>
              <h4 class="fw-bold text-dark mt-2 mb-0">S/ {{ estado.montoApertura || 0 | number:'1.2-2' }}</h4>
              <small class="text-muted">Fondo inicial de cambio</small>
            </div>
          </div>

          <div class="col-md-3 col-sm-6">
            <div class="card border-0 rounded-4 shadow-sm bg-white p-3">
              <span class="text-muted small fw-bold">VENTAS EFECTIVO</span>
              <h4 class="fw-bold text-success mt-2 mb-0">S/ {{ estado.totalVentasEfectivo || 0 | number:'1.2-2' }}</h4>
              <small class="text-muted">Cobros en mostrador</small>
            </div>
          </div>

          <div class="col-md-3 col-sm-6">
            <div class="card border-0 rounded-4 shadow-sm bg-white p-3">
              <span class="text-muted small fw-bold">VENTAS DIGITALES (YAPE/TARJ)</span>
              <h4 class="fw-bold text-primary mt-2 mb-0">S/ {{ estado.totalVentasDigital || 0 | number:'1.2-2' }}</h4>
              <small class="text-muted">En cuenta bancaria</small>
            </div>
          </div>

          <div class="col-md-3 col-sm-6">
            <div class="card border-0 rounded-4 shadow-sm bg-white p-3">
              <span class="text-muted small fw-bold">INGRESOS / EGRESOS MANUALES</span>
              <div class="d-flex justify-content-between mt-2">
                <span class="text-success fw-bold">+ S/ {{ estado.totalIngresos || 0 | number:'1.2-2' }}</span>
                <span class="text-danger fw-bold">- S/ {{ estado.totalEgresos || 0 | number:'1.2-2' }}</span>
              </div>
              <small class="text-muted">Gastos menores / recargas</small>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- MODAL APERTURA CAJA -->
    @if (modalApertura) {
      <div class="modal-backdrop fade show" (click)="modalApertura = false"></div>
      <div class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 440px;">
          <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-success text-white rounded-top-4">
              <h5 class="modal-title fw-bold"><i class="bi bi-unlock-fill me-2"></i> Apertura de Caja</h5>
              <button type="button" class="btn-close btn-close-white" (click)="modalApertura = false"></button>
            </div>
            <form (ngSubmit)="abrirCaja()">
              <div class="modal-body p-4">
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted">Monto Inicial en Efectivo (S/) *</label>
                  <input type="number" step="0.5" class="form-control form-control-lg" [(ngModel)]="aperturaForm.montoInicial"
                         name="montoInicial" placeholder="100.00" required autofocus>
                  <small class="text-muted">Fondo asignado para entregar vuelto a los clientes.</small>
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted">Observaciones</label>
                  <input type="text" class="form-control" [(ngModel)]="aperturaForm.observaciones"
                         name="observaciones" placeholder="Turno Mañana / Tarde">
                </div>
              </div>
              <div class="modal-footer bg-light border-0 rounded-bottom-4">
                <button type="button" class="btn btn-secondary" (click)="modalApertura = false">Cancelar</button>
                <button type="submit" class="btn btn-success fw-bold" [disabled]="procesando">
                  Iniciar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- MODAL MOVIMIENTO MANUAL (INGRESO / EGRESO) -->
    @if (modalMovimiento) {
      <div class="modal-backdrop fade show" (click)="modalMovimiento = false"></div>
      <div class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 440px;">
          <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-primary text-white rounded-top-4">
              <h5 class="modal-title fw-bold"><i class="bi bi-arrow-left-right me-2"></i> Registrar Movimiento</h5>
              <button type="button" class="btn-close btn-close-white" (click)="modalMovimiento = false"></button>
            </div>
            <form (ngSubmit)="guardarMovimiento()">
              <div class="modal-body p-4">
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted">Tipo de Movimiento *</label>
                  <select class="form-select" [(ngModel)]="movForm.tipo" name="tipo">
                    <option value="INGRESO">🟢 Ingreso de Dinero (Entrada)</option>
                    <option value="EGRESO">🔴 Egreso de Dinero (Salida / Gasto)</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted">Monto (S/) *</label>
                  <input type="number" step="0.5" class="form-control" [(ngModel)]="movForm.monto" name="monto" required>
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted">Motivo / Concepto *</label>
                  <input type="text" class="form-control" [(ngModel)]="movForm.motivo" name="motivo"
                         placeholder="Ej: Pago de flete, compra de bolsas..." required>
                </div>
              </div>
              <div class="modal-footer bg-light border-0 rounded-bottom-4">
                <button type="button" class="btn btn-secondary" (click)="modalMovimiento = false">Cancelar</button>
                <button type="submit" class="btn btn-primary fw-bold" [disabled]="procesando">
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- MODAL CIERRE DE CAJA -->
    @if (modalCierre) {
      <div class="modal-backdrop fade show" (click)="modalCierre = false"></div>
      <div class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
          <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-danger text-white rounded-top-4">
              <h5 class="modal-title fw-bold"><i class="bi bi-lock-fill me-2"></i> Cuadre y Cierre de Caja</h5>
              <button type="button" class="btn-close btn-close-white" (click)="modalCierre = false"></button>
            </div>
            <form (ngSubmit)="cerrarCaja()">
              <div class="modal-body p-4">
                <div class="p-3 bg-light rounded-3 border mb-3">
                  <div class="d-flex justify-content-between text-muted small mb-1">
                    <span>Efectivo Calculado por Sistema:</span>
                    <strong class="text-dark">S/ {{ estado?.saldoCalculado || 0 | number:'1.2-2' }}</strong>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted">Efectivo Real Contado en Gaveta (S/) *</label>
                  <input type="number" step="0.5" class="form-control form-control-lg" [(ngModel)]="cierreForm.montoFinalReal"
                         name="montoFinalReal" required autofocus>
                  @if (estado && cierreForm.montoFinalReal !== undefined) {
                    @let dif = cierreForm.montoFinalReal - (estado.saldoCalculado || 0);
                    <div class="small mt-2 fw-bold" [ngClass]="dif >= 0 ? 'text-success' : 'text-danger'">
                      Diferencia: S/ {{ dif | number:'1.2-2' }}
                      {{ dif === 0 ? '(Exacto)' : (dif > 0 ? '(Sobrante)' : '(Faltante)') }}
                    </div>
                  }
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted">Observaciones de Cierre</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="cierreForm.observaciones"
                            name="observaciones" placeholder="Detalle de entrega a gerencia..."></textarea>
                </div>
              </div>
              <div class="modal-footer bg-light border-0 rounded-bottom-4">
                <button type="button" class="btn btn-secondary" (click)="modalCierre = false">Cancelar</button>
                <button type="submit" class="btn btn-danger fw-bold" [disabled]="procesando">
                  Finalizar & Cerrar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class CajaComponent implements OnInit {
  private cajaService = inject(CajaService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  estado: EstadoCajaResponse | null = null;
  cargando = false;
  procesando = false;

  modalApertura = false;
  aperturaForm: AperturaCajaRequest = { montoInicial: 100 };

  modalMovimiento = false;
  movForm: MovimientoCajaRequest = { tipo: 'EGRESO', monto: 10, motivo: '' };

  modalCierre = false;
  cierreForm: CierreCajaRequest = { montoFinalReal: 0 };

  ngOnInit() {
    this.cargarEstado();
  }

  cargarEstado() {
    this.cargando = true;
    this.cajaService.obtenerEstado().subscribe({
      next: est => {
        this.estado = est;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  abrirCaja() {
    this.procesando = true;
    const monto = this.aperturaForm.montoInicial ?? this.aperturaForm.montoApertura ?? 0;
    const datos: AperturaCajaRequest = {
      montoApertura: monto,
      montoInicial: monto,
      observaciones: this.aperturaForm.observaciones || ''
    };
    this.cajaService.abrir(datos).subscribe({
      next: est => {
        this.procesando = false;
        this.estado = est;
        this.modalApertura = false;
        this.toastService.success('Caja Abierta', 'Turno iniciado correctamente.');
        this.cargarEstado();
      },
      error: err => {
        this.procesando = false;
        this.toastService.error('Error', err.error?.mensaje || 'No se pudo abrir la caja.');
      }
    });
  }

  guardarMovimiento() {
    this.procesando = true;
    this.cajaService.registrarMovimiento(this.movForm).subscribe({
      next: () => {
        this.procesando = false;
        this.modalMovimiento = false;
        this.toastService.success('Registrado', 'Movimiento de caja asentado.');
        this.cargarEstado();
      },
      error: err => {
        this.procesando = false;
        this.toastService.error('Error', err.error?.mensaje || 'No se pudo registrar movimiento.');
      }
    });
  }

  abrirModalCierre() {
    this.cierreForm = {
      montoFinalReal: this.estado?.saldoCalculado || 0,
      observaciones: ''
    };
    this.modalCierre = true;
  }

  cerrarCaja() {
    this.procesando = true;
    const monto = this.cierreForm.montoFinalReal ?? this.cierreForm.montoCierreReal ?? 0;
    const datos: CierreCajaRequest = {
      montoCierreReal: monto,
      montoFinalReal: monto,
      observaciones: this.cierreForm.observaciones || ''
    };
    this.cajaService.cerrar(datos).subscribe({
      next: est => {
        this.procesando = false;
        this.estado = est;
        this.modalCierre = false;
        this.toastService.success('Caja Cerrada', 'Turno finalizado y arqueo completado.');
        this.cargarEstado();
      },
      error: err => {
        this.procesando = false;
        this.toastService.error('Error', err.error?.mensaje || 'No se pudo cerrar la caja.');
      }
    });
  }
}
