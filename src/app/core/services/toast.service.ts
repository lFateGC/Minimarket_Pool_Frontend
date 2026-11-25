import { Injectable, signal } from '@angular/core';

export interface ToastMensaje {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: 'success' | 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<ToastMensaje[]>([]);
  public toasts = this.toastsSignal.asReadonly();
  private contador = 0;

  mostrar(titulo: string, mensaje: string, tipo: 'success' | 'danger' | 'warning' | 'info' = 'info', duracionMs = 4000) {
    const id = ++this.contador;
    const nuevo: ToastMensaje = { id, titulo, mensaje, tipo };
    this.toastsSignal.update(lista => [...lista, nuevo]);

    if (duracionMs > 0) {
      setTimeout(() => this.remover(id), duracionMs);
    }
  }

  success(titulo: string, mensaje: string) {
    this.mostrar(titulo, mensaje, 'success');
  }

  error(titulo: string, mensaje: string) {
    this.mostrar(titulo, mensaje, 'danger', 5000);
  }

  warning(titulo: string, mensaje: string) {
    this.mostrar(titulo, mensaje, 'warning');
  }

  info(titulo: string, mensaje: string) {
    this.mostrar(titulo, mensaje, 'info');
  }

  remover(id: number) {
    this.toastsSignal.update(lista => lista.filter(t => t.id !== id));
  }
}
