import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categoria, Producto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/productos`;
  private readonly catUrl = `${environment.apiUrl}/categorias`;

  listar(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.baseUrl}/${id}`);
  }

  buscar(filtro: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.baseUrl}/buscar`, { params: { filtro } });
  }

  crear(producto: Partial<Producto>): Observable<Producto> {
    return this.http.post<Producto>(this.baseUrl, producto);
  }

  actualizar(id: number, producto: Partial<Producto>): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/${id}`, producto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listarCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.catUrl);
  }

  crearCategoria(cat: Partial<Categoria>): Observable<Categoria> {
    return this.http.post<Categoria>(this.catUrl, cat);
  }

  actualizarCategoria(id: number, cat: Partial<Categoria>): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.catUrl}/${id}`, cat);
  }

  eliminarCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.catUrl}/${id}`);
  }

  subirImagen(archivo: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<{ url: string }>(`${this.baseUrl}/subir-imagen`, formData);
  }
}
