import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/clientes`;

  listar(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/${id}`);
  }

  obtenerPorDocumento(numDoc: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/documento/${encodeURIComponent(numDoc)}`);
  }

  obtenerMiPerfil(): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/mi-perfil`);
  }

  actualizarMiPerfil(datos: { nombres?: string; apellidos?: string; telefono?: string; direccion?: string }): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.baseUrl}/mi-perfil`, datos);
  }

  crear(cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(this.baseUrl, cliente);
  }

  actualizar(id: number, cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.baseUrl}/${id}`, cliente);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
