import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../core/services/producto.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { VentaService } from '../../../core/services/venta.service';
import { ToastService } from '../../../core/services/toast.service';
import { BoletaSunatComponent } from '../../../shared/components/boleta-sunat.component';
import { Cliente, DetalleVentaRequest, Producto, VentaRequest, VentaResponse } from '../../../core/models';

interface ItemPOS {
  producto: Producto;
  cantidad: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, BoletaSunatComponent],
  template: `
    <div class="pos-container">
      <div class="row g-3">
        <!-- COLUMNA IZQUIERDA: BÚSQUEDA Y CATÁLOGO DE PRODUCTOS -->
        <div class="col-lg-7">
          <div class="card border-0 rounded-4 shadow-sm bg-white p-3 h-100 d-flex flex-column">
            <!-- Barra de Búsqueda Rápida / Código de Barras -->
            <div class="mb-3">
              <div class="input-group">
                <span class="input-group-text bg-light text-muted"><i class="bi bi-upc-scan fs-5"></i></span>
                <input type="text" class="form-control form-control-lg"
                       placeholder="Escanear código de barra (SKU) o buscar producto..."
                       [(ngModel)]="busquedaTexto" (keyup)="filtrarProductos()" (keydown.enter)="escanearPrimerCoincidente()"
                       autofocus>
                <button class="btn btn-outline-secondary" type="button" (click)="busquedaTexto=''; filtrarProductos()">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>

            <!-- Categorías rápidas -->
            <div class="d-flex gap-2 overflow-auto pb-2 mb-3">
              <button class="btn btn-sm rounded-pill px-3"
                      [class.btn-danger]="catFiltro === ''"
                      [class.btn-outline-secondary]="catFiltro !== ''"
                      (click)="filtrarPorCat('')">
                Todas
              </button>
              @for (cat of categorias; track cat.id) {
                <button class="btn btn-sm rounded-pill px-3 text-nowrap"
                        [class.btn-danger]="catFiltro === cat.nombre"
                        [class.btn-outline-secondary]="catFiltro !== cat.nombre"
                        (click)="filtrarPorCat(cat.nombre)">
                  {{ cat.nombre }}
                </button>
              }
            </div>

            <!-- Grid de Productos Rápidos -->
            <div class="flex-grow-1 overflow-auto pe-1" style="max-height: 520px;">
              <div class="row g-2">
                @for (p of productosFiltrados; track p.id) {
                  <div class="col-6 col-sm-6 col-md-4">
                    <div class="card h-100 border p-2 pos-prod-card"
                         [class.opacity-50]="p.stockActual <= 0"
                         (click)="p.stockActual > 0 && agregarAlTicket(p)">
                      <div class="d-flex justify-content-between align-items-start mb-1">
                        <span class="badge bg-light text-dark border">{{ p.categoriaNombre || 'General' }}</span>
                        <span class="badge" [ngClass]="p.stockActual <= 0 ? 'bg-danger' : (p.stockActual <= 5 ? 'bg-warning text-dark' : 'bg-success')">
                          {{ p.stockActual }} u.
                        </span>
                      </div>
                      <strong class="small text-dark text-truncate d-block" [title]="p.nombre">{{ p.nombre }}</strong>
                      <small class="text-muted d-block" style="font-size: 0.72rem;">SKU: {{ p.sku }}</small>
                      <div class="mt-auto pt-2 text-danger fw-bold fs-6">
                        S/ {{ p.precioUnitario | number:'1.2-2' }}
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMNA DERECHA: TICKET DE VENTA Y COBRO -->
        <div class="col-lg-5">
          <div class="card border-0 rounded-4 shadow-sm bg-white p-3 h-100 d-flex flex-column">
            <!-- Selector de Cliente -->
            <div class="mb-3 p-2 bg-light rounded-3 border">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <label class="form-label small fw-bold text-muted mb-0">Cliente:</label>
                <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                        (click)="modalNuevoCliente = true">
                  <i class="bi bi-person-plus-fill me-1"></i> + Registrar Cliente
                </button>
              </div>

              <div class="input-group input-group-sm">
                <select class="form-select" [(ngModel)]="clienteSeleccionadoId">
                  <option [ngValue]="null">👤 Público General / Varios (Sin DNI)</option>
                  @for (c of clientes; track c.id) {
                    <option [ngValue]="c.id">
                      {{ c.tipoDocumento }}: {{ c.numeroDocumento }} - {{ c.nombreCompleto || c.nombres }}
                    </option>
                  }
                </select>
              </div>
            </div>

            <!-- Tabla de Ítems en el Ticket -->
            <div class="flex-grow-1 overflow-auto border rounded-3 p-2 mb-3" style="max-height: 260px;">
              @if (ticket.length === 0) {
                <div class="text-center py-5 text-muted">
                  <i class="bi bi-receipt fs-1 d-block mb-2 text-secondary"></i>
                  <span>Ticket vacío. Haz clic en un producto para agregarlo.</span>
                </div>
              } @else {
                <table class="table table-sm align-middle mb-0">
                  <thead class="table-light small">
                    <tr>
                      <th>Cant.</th>
                      <th>Producto</th>
                      <th class="text-end">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody class="small">
                    @for (item of ticket; track item.producto.id) {
                      <tr>
                        <td style="width: 80px;">
                          <div class="input-group input-group-sm">
                            <input type="number" class="form-control p-1 text-center" [(ngModel)]="item.cantidad"
                                   (change)="validarCantidad(item)" min="1" [max]="item.producto.stockActual">
                          </div>
                        </td>
                        <td>
                          <div class="text-truncate fw-semibold" style="max-width: 140px;" [title]="item.producto.nombre">
                            {{ item.producto.nombre }}
                          </div>
                          <small class="text-muted">S/ {{ item.producto.precioUnitario | number:'1.2-2' }} c/u</small>
                        </td>
                        <td class="text-end fw-bold text-danger">
                          S/ {{ (item.producto.precioUnitario * item.cantidad) | number:'1.2-2' }}
                        </td>
                        <td class="text-center" style="width: 30px;">
                          <button class="btn btn-link text-danger p-0" (click)="eliminarItem(item.producto.id)">
                            <i class="bi bi-x-circle"></i>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>

            <!-- Desglose de Pago -->
            <div class="p-3 bg-light rounded-3 border mt-auto">
              <!-- Tipo de Comprobante -->
              <div class="row g-2 mb-2">
                <div class="col-6">
                  <label class="form-label small fw-bold text-muted mb-1">Comprobante:</label>
                  <select class="form-select form-select-sm" [(ngModel)]="tipoComprobante">
                    <option value="BOLETA">Boleta Electrónica</option>
                    <option value="FACTURA">Factura Electrónica</option>
                    <option value="TICKET">Ticket de Caja</option>
                  </select>
                </div>

                <div class="col-6">
                  <label class="form-label small fw-bold text-muted mb-1">Medio de Pago:</label>
                  <select class="form-select form-select-sm" [(ngModel)]="metodoPago">
                    <option value="EFECTIVO">💵 Efectivo</option>
                    <option value="YAPE">📱 Yape</option>
                    <option value="PLIN">📱 Plin</option>
                    <option value="TARJETA">💳 Tarjeta</option>
                  </select>
                </div>
              </div>

              <!-- Calculadora de Efectivo y Vuelto -->
              @if (metodoPago === 'EFECTIVO') {
                <div class="row g-2 align-items-center mb-2">
                  <div class="col-6">
                    <label class="form-label small text-muted mb-0">Efectivo Recibido:</label>
                    <div class="input-group input-group-sm">
                      <span class="input-group-text">S/</span>
                      <input type="number" step="0.5" class="form-control" [(ngModel)]="montoEfectivoRecibido"
                             placeholder="Monto" [min]="totalTicket()">
                    </div>
                  </div>
                  <div class="col-6 text-end">
                    <small class="text-muted d-block">Vuelto a Entregar:</small>
                    <strong class="fs-6 text-success">
                      S/ {{ (montoEfectivoRecibido > totalTicket() ? (montoEfectivoRecibido - totalTicket()) : 0) | number:'1.2-2' }}
                    </strong>
                  </div>
                </div>
              }

              <!-- Totales -->
              <div class="d-flex justify-content-between small text-muted mb-1">
                <span>Subtotal (Op. Gravada):</span>
                <span>S/ {{ (totalTicket() / 1.18) | number:'1.2-2' }}</span>
              </div>
              <div class="d-flex justify-content-between small text-muted mb-2">
                <span>I.G.V. (18%):</span>
                <span>S/ {{ (totalTicket() - (totalTicket() / 1.18)) | number:'1.2-2' }}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center border-top pt-2 mb-3">
                <span class="fs-5 fw-bold text-dark">TOTAL COBRAR:</span>
                <span class="fs-3 fw-bold text-danger">S/ {{ totalTicket() | number:'1.2-2' }}</span>
              </div>

              <!-- Botón de Cobro -->
              <div class="d-grid gap-2">
                <button class="btn btn-warning py-2 fw-bold text-dark shadow-sm d-flex align-items-center justify-content-center gap-2"
                        [disabled]="ticket.length === 0 || cobrando"
                        (click)="cobrarVenta()">
                  @if (cobrando) {
                    <span class="spinner-border spinner-border-sm"></span> Procesando...
                  } @else {
                    <i class="bi bi-printer-fill fs-5"></i>
                    <span>Cobrar e Imprimir Comprobante</span>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL BOLETA EMITIDA -->
    @if (modalBoletaVisible && ventaEmitida) {
      <div class="modal-backdrop fade show" (click)="modalBoletaVisible = false"></div>
      <div class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content rounded-4 border-0 shadow-lg">
            <div class="modal-header bg-danger text-white rounded-top-4">
              <h5 class="modal-title fw-bold">
                <i class="bi bi-check-circle-fill text-warning me-2"></i> Venta Registrada con Éxito
              </h5>
              <button type="button" class="btn-close btn-close-white" (click)="modalBoletaVisible = false"></button>
            </div>
            <div class="modal-body p-3">
              <app-boleta-sunat #boletaPos [venta]="ventaEmitida"></app-boleta-sunat>
            </div>
            <div class="modal-footer bg-light border-0 rounded-bottom-4 d-flex justify-content-between">
              <button type="button" class="btn btn-secondary" (click)="modalBoletaVisible = false">Nueva Venta</button>
              <button type="button" class="btn btn-danger fw-bold px-4" (click)="boletaPos.imprimir()">
                <i class="bi bi-printer-fill me-1"></i> Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- MODAL REGISTRO RÁPIDO DE CLIENTE EN CAJA -->
    @if (modalNuevoCliente) {
      <div class="modal-backdrop fade show" (click)="modalNuevoCliente = false"></div>
      <div class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-danger text-white rounded-top-4">
              <h5 class="modal-title fw-bold"><i class="bi bi-person-plus-fill me-2"></i> Registrar Cliente en Mostrador</h5>
              <button type="button" class="btn-close btn-close-white" (click)="modalNuevoCliente = false"></button>
            </div>
            <form (ngSubmit)="guardarClienteRapido()">
              <div class="modal-body p-4">
                <div class="row g-2">
                  <div class="col-4">
                    <label class="form-label small fw-bold">Tipo Doc.</label>
                    <select class="form-select form-select-sm" [(ngModel)]="nuevoCli.tipoDocumento" name="tipoDocumento">
                      <option value="DNI">DNI</option>
                      <option value="RUC">RUC</option>
                      <option value="CE">C.E.</option>
                    </select>
                  </div>
                  <div class="col-8">
                    <label class="form-label small fw-bold">N° Documento *</label>
                    <input type="text" class="form-control form-control-sm" [(ngModel)]="nuevoCli.numeroDocumento" name="numeroDocumento"
                           maxlength="11" required>
                  </div>
                  <div class="col-12">
                    <label class="form-label small fw-bold">Nombres o Razón Social *</label>
                    <input type="text" class="form-control form-control-sm" [(ngModel)]="nuevoCli.nombres" name="nombres" required>
                  </div>
                  <div class="col-12">
                    <label class="form-label small fw-bold">Apellidos</label>
                    <input type="text" class="form-control form-control-sm" [(ngModel)]="nuevoCli.apellidos" name="apellidos">
                  </div>
                  <div class="col-12">
                    <label class="form-label small fw-bold">Teléfono / WhatsApp</label>
                    <input type="tel" class="form-control form-control-sm" [(ngModel)]="nuevoCli.telefono" name="telefono">
                  </div>
                  <div class="col-12">
                    <label class="form-label small fw-bold">Dirección</label>
                    <input type="text" class="form-control form-control-sm" [(ngModel)]="nuevoCli.direccion" name="direccion">
                  </div>
                </div>
              </div>
              <div class="modal-footer bg-light border-0 rounded-bottom-4">
                <button type="button" class="btn btn-secondary btn-sm" (click)="modalNuevoCliente = false">Cancelar</button>
                <button type="submit" class="btn btn-danger btn-sm fw-bold">Guardar y Seleccionar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .pos-prod-card {
      cursor: pointer;
      border-radius: 10px;
      transition: all 0.15s ease;
      background: #ffffff;
    }
    .pos-prod-card:hover {
      border-color: #dc2626 !important;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
      transform: translateY(-2px);
    }
  `]
})
export class PosComponent implements OnInit {
  private productoService = inject(ProductoService);
  private clienteService = inject(ClienteService);
  private ventaService = inject(VentaService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias: any[] = [];
  clientes: Cliente[] = [];

  busquedaTexto = '';
  catFiltro = '';
  ticket: ItemPOS[] = [];

  clienteSeleccionadoId: number | null = null;
  tipoComprobante: 'BOLETA' | 'FACTURA' | 'TICKET' = 'BOLETA';
  metodoPago: 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA' = 'EFECTIVO';
  montoEfectivoRecibido = 0;
  cobrando = false;

  modalBoletaVisible = false;
  ventaEmitida: VentaResponse | null = null;

  modalNuevoCliente = false;
  nuevoCli: Partial<Cliente> = { tipoDocumento: 'DNI', numeroDocumento: '', nombres: '', apellidos: '', telefono: '', direccion: '' };

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.productoService.listar().subscribe({
      next: prods => {
        this.productos = prods;
        this.filtrarProductos();
        this.cdr.markForCheck();
      },
      error: () => {}
    });

    this.productoService.listarCategorias().subscribe({
      next: cats => {
        this.categorias = cats;
        this.cdr.markForCheck();
      },
      error: () => {}
    });

    this.clienteService.listar().subscribe({
      next: clis => {
        this.clientes = clis.filter(c => c.activo);
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  filtrarProductos() {
    const q = this.busquedaTexto.toLowerCase().trim();
    this.productosFiltrados = this.productos.filter(p => {
      const matchQ = !q || p.nombre.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
      const matchCat = !this.catFiltro || p.categoriaNombre === this.catFiltro;
      return matchQ && matchCat;
    });
  }

  filtrarPorCat(cat: string) {
    this.catFiltro = cat;
    this.filtrarProductos();
  }

  escanearPrimerCoincidente() {
    if (this.productosFiltrados.length > 0) {
      this.agregarAlTicket(this.productosFiltrados[0]);
      this.busquedaTexto = '';
      this.filtrarProductos();
    }
  }

  agregarAlTicket(p: Producto) {
    const index = this.ticket.findIndex(it => it.producto.id === p.id);
    if (index >= 0) {
      if (this.ticket[index].cantidad < p.stockActual) {
        this.ticket[index].cantidad++;
      } else {
        this.toastService.warning('Stock Límite', `Solo quedan ${p.stockActual} unidades disponibles.`);
      }
    } else {
      this.ticket.push({ producto: p, cantidad: 1 });
    }
  }

  validarCantidad(item: ItemPOS) {
    if (item.cantidad <= 0) item.cantidad = 1;
    if (item.cantidad > item.producto.stockActual) {
      item.cantidad = item.producto.stockActual;
      this.toastService.warning('Stock Límite', `Cantidad ajustada al stock máximo (${item.producto.stockActual}).`);
    }
  }

  eliminarItem(id: number) {
    this.ticket = this.ticket.filter(it => it.producto.id !== id);
  }

  totalTicket(): number {
    return this.ticket.reduce((acc, it) => acc + (it.producto.precioUnitario * it.cantidad), 0);
  }

  cobrarVenta() {
    if (this.ticket.length === 0) return;

    const total = this.totalTicket();
    const vuelto = (this.metodoPago === 'EFECTIVO' && this.montoEfectivoRecibido > total)
      ? this.montoEfectivoRecibido - total
      : 0;

    const detalles: DetalleVentaRequest[] = this.ticket.map(it => ({
      productoId: it.producto.id,
      cantidad: it.cantidad,
      precioUnitario: it.producto.precioUnitario
    }));

    const req: VentaRequest = {
      clienteId: this.clienteSeleccionadoId,
      tipoComprobante: this.tipoComprobante,
      metodoPago: this.metodoPago,
      montoEfectivo: this.metodoPago === 'EFECTIVO' ? (this.montoEfectivoRecibido || total) : total,
      vuelto,
      items: detalles,
      detalles
    };

    this.cobrando = true;
    this.ventaService.registrarVentaPOS(req).subscribe({
      next: res => {
        this.cobrando = false;
        this.ventaEmitida = res;
        this.modalBoletaVisible = true;
        this.ticket = [];
        this.montoEfectivoRecibido = 0;
        this.toastService.success('Venta Exitosa', `Venta registrada #${res.id}`);
        this.cargarDatos(); // Actualizar stock
      },
      error: err => {
        this.cobrando = false;
        this.toastService.error('Error al Cobrar', err.error?.mensaje || 'No se pudo registrar la venta.');
      }
    });
  }

  guardarClienteRapido() {
    if (!this.nuevoCli.nombres || !this.nuevoCli.numeroDocumento) {
      this.toastService.warning('Campos Requeridos', 'Nombres y documento son obligatorios.');
      return;
    }

    this.clienteService.crear(this.nuevoCli).subscribe({
      next: cli => {
        this.clientes.unshift(cli);
        this.clienteSeleccionadoId = cli.id;
        this.modalNuevoCliente = false;
        this.nuevoCli = { tipoDocumento: 'DNI', numeroDocumento: '', nombres: '', apellidos: '', telefono: '', direccion: '' };
        this.toastService.success('Cliente Registrado', `Cliente ${cli.nombres} añadido.`);
      },
      error: err => {
        this.toastService.error('Error', err.error?.mensaje || 'No se pudo registrar el cliente.');
      }
    });
  }
}
