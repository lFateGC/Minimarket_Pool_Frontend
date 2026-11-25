import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoteInventario } from '../models';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/inventario`;

  listarLotes(): Observable<LoteInventario[]> {
    return this.http.get<LoteInventario[]>(`${this.baseUrl}/lotes`);
  }

  crearLote(lote: Partial<LoteInventario>): Observable<LoteInventario> {
    return this.http.post<LoteInventario>(`${this.baseUrl}/lotes`, lote);
  }

  ajustarStock(loteId: number, cantidad: number, motivo: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/ajustar-stock`, { loteId, cantidad, motivo });
  }
}
