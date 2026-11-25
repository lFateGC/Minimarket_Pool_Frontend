import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Proveedor } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/proveedores`;

  listar(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.baseUrl);
  }

  crear(prov: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.baseUrl, prov);
  }

  actualizar(id: number, prov: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.baseUrl}/${id}`, prov);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
