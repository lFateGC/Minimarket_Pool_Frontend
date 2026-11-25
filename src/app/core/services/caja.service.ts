import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AperturaCajaRequest, CierreCajaRequest, EstadoCajaResponse, MovimientoCajaRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CajaService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/caja`;

  obtenerEstado(): Observable<EstadoCajaResponse> {
    return this.http.get<EstadoCajaResponse>(`${this.baseUrl}/estado`);
  }

  abrir(datos: AperturaCajaRequest): Observable<EstadoCajaResponse> {
    return this.http.post<EstadoCajaResponse>(`${this.baseUrl}/abrir`, datos);
  }

  cerrar(datos: CierreCajaRequest): Observable<EstadoCajaResponse> {
    return this.http.post<EstadoCajaResponse>(`${this.baseUrl}/cerrar`, datos);
  }

  registrarMovimiento(datos: MovimientoCajaRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/movimiento`, datos);
  }
}
