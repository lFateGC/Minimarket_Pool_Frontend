import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VentaRequest, VentaResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ventas`;

  registrarVentaPOS(venta: VentaRequest): Observable<VentaResponse> {
    return this.http.post<VentaResponse>(this.baseUrl, venta);
  }

  registrarCompraCliente(venta: VentaRequest): Observable<VentaResponse> {
    return this.http.post<VentaResponse>(`${this.baseUrl}/mi-compra`, venta);
  }

  obtenerMisCompras(): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(`${this.baseUrl}/mis-compras`);
  }

  listarVentas(): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<VentaResponse> {
    return this.http.get<VentaResponse>(`${this.baseUrl}/${id}`);
  }
}
