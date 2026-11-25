import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReporteService } from '../../../core/services/reporte.service';
import { ProductoService } from '../../../core/services/producto.service';
import { VentaService } from '../../../core/services/venta.service';
import { VentaResponse } from '../../../core/models';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reportes-container">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 class="fw-bold text-dark mb-1">Reportes & Métricas de Negocio</h4>
          <p class="text-muted small mb-0">Análisis de ventas, rentabilidad, rotación de inventario y alertas preventivas.</p>
        </div>
      </div>

      <!-- Resumen de Métricas -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card border-0 rounded-4 shadow-sm bg-white p-3">
            <span class="text-muted small fw-bold">TOTAL HISTÓRICO DE VENTAS</span>
            <h3 class="fw-bold text-danger mt-2 mb-0">S/ {{ totalVentasHistoricas | number:'1.2-2' }}</h3>
            <small class="text-muted">{{ ventas.length }} transacciones realizadas</small>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card border-0 rounded-4 shadow-sm bg-white p-3">
            <span class="text-muted small fw-bold">ALERTA REORDEN (STOCK BAJO)</span>
            <h3 class="fw-bold text-warning mt-2 mb-0">{{ alertasStock.length }} productos</h3>
            <small class="text-muted">Por debajo del stock mínimo</small>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card border-0 rounded-4 shadow-sm bg-white p-3">
            <span class="text-muted small fw-bold">LOTES EN RIESGO DE CADUCIDAD</span>
            <h3 class="fw-bold text-danger mt-2 mb-0">{{ lotesRiesgo.length }} lotes</h3>
            <small class="text-muted">Requieren rotación prioritaria</small>
          </div>
        </div>
      </div>

      <!-- Tabla de Ventas Recientes -->
      <div class="card border-0 rounded-4 shadow-sm bg-white overflow-hidden mb-4">
        <div class="card-header bg-white py-3 border-bottom">
          <strong class="text-dark">Últimas Ventas Realizadas (Tienda y Web)</strong>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light small">
              <tr>
                <th>Venta #</th>
                <th>Fecha y Hora</th>
                <th>Cliente</th>
                <th>Comprobante</th>
                <th>Método Pago</th>
                <th class="text-end">Total</th>
              </tr>
            </thead>
            <tbody class="small">
              @if (ventas.length === 0) {
                <tr><td colspan="6" class="text-center py-4 text-muted">No se registran ventas.</td></tr>
              } @else {
                @for (v of ventas.slice(0, 10); track v.id) {
                  <tr>
                    <td><code>#{{ v.id }}</code></td>
                    <td>{{ v.fecha.replace('T', ' ').substring(0, 16) }}</td>
                    <td>{{ v.clienteNombre || 'Público General' }}</td>
                    <td><span class="badge bg-light text-dark border">{{ v.tipoComprobante }}</span></td>
                    <td><span class="badge bg-warning text-dark">{{ v.metodoPago }}</span></td>
                    <td class="text-end fw-bold text-danger">S/ {{ v.total | number:'1.2-2' }}</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ReportesComponent implements OnInit {
  private reporteService = inject(ReporteService);
  private productoService = inject(ProductoService);
  private ventaService = inject(VentaService);
  private cdr = inject(ChangeDetectorRef);

  ventas: VentaResponse[] = [];
  alertasStock: any[] = [];
  lotesRiesgo: any[] = [];
  totalVentasHistoricas = 0;

  ngOnInit() {
    this.ventaService.listarVentas().subscribe({
      next: lista => {
        this.ventas = lista.slice().reverse();
        this.totalVentasHistoricas = lista.reduce((acc, v) => acc + v.total, 0);
        this.cdr.markForCheck();
      },
      error: () => {}
    });

    this.reporteService.stockBajo().subscribe({
      next: (prods: any[]) => {
        this.alertasStock = prods;
        this.cdr.markForCheck();
      },
      error: () => {}
    });

    this.reporteService.porVencer().subscribe({
      next: (lotes: any[]) => {
        this.lotesRiesgo = lotes;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }
}
