import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reportes`;

  resumenDashboard(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard`);
  }

  stockBajo(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/stock-bajo`);
  }

  porVencer(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/por-vencer`);
  }

  ventasPorPeriodo(inicio: string, fin: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/ventas`, { params: { inicio, fin } });
  }
}
