import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  JwtResponse,
  LoginRequest,
  RegistroClienteRequest,
  RegistroRequest,
  Usuario,
  VerificacionDocumentoResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private tokenSignal = signal<string | null>(this.obtenerTokenStorage());
  private currentUserSignal = signal<Usuario | null>(this.obtenerUsuarioStorage());

  public token = this.tokenSignal.asReadonly();
  public currentUser = this.currentUserSignal.asReadonly();

  public isLoggedIn = computed(() => !!this.tokenSignal());
  public userRole = computed(() => this.currentUserSignal()?.rol ?? null);
  public isAdmin = computed(() => this.currentUserSignal()?.rol === 'ADMIN');
  public isVendedor = computed(() => this.currentUserSignal()?.rol === 'VENDEDOR');
  public isCliente = computed(() => this.currentUserSignal()?.rol === 'CLIENTE');
  public isPersonal = computed(() => {
    const rol = this.currentUserSignal()?.rol;
    return rol === 'ADMIN' || rol === 'VENDEDOR';
  });

  private obtenerTokenStorage(): string | null {
    return localStorage.getItem('jwt_token');
  }

  private obtenerUsuarioStorage(): Usuario | null {
    const raw = localStorage.getItem('jwt_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  login(credenciales: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.baseUrl}/login`, credenciales).pipe(
      tap(res => {
        this.guardarSesion(res);
      })
    );
  }

  registrarPersonal(datos: RegistroRequest): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.baseUrl}/registro`, datos);
  }

  registrarCliente(datos: RegistroClienteRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.baseUrl}/registro-cliente`, datos).pipe(
      tap(res => {
        this.guardarSesion(res);
      })
    );
  }

  verificarDocumento(doc: string): Observable<VerificacionDocumentoResponse> {
    return this.http.get<VerificacionDocumentoResponse>(`${this.baseUrl}/verificar-documento/${encodeURIComponent(doc)}`);
  }

  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.baseUrl}/usuarios`);
  }

  actualizarUsuario(id: number, usuario: Partial<Usuario> & { password?: string }): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/usuarios/${id}`, usuario);
  }

  eliminarUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/usuarios/${id}`);
  }

  guardarSesion(res: JwtResponse) {
    const usuario: Usuario = {
      id: res.id || 0,
      email: res.email,
      nombre: res.nombre,
      rol: res.rol
    };
    localStorage.setItem('jwt_token', res.token);
    localStorage.setItem('jwt_user', JSON.stringify(usuario));
    this.tokenSignal.set(res.token);
    this.currentUserSignal.set(usuario);
  }

  logout(redirigirA = '/') {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_user');
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    if (redirigirA) {
      this.router.navigateByUrl(redirigirA);
    }
  }
}
