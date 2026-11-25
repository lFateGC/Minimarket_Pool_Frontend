import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 9999;">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast show align-items-center text-white border-0 mb-2 shadow-lg"
             [ngClass]="{
               'bg-success': toast.tipo === 'success',
               'bg-danger': toast.tipo === 'danger',
               'bg-warning text-dark': toast.tipo === 'warning',
               'bg-info text-dark': toast.tipo === 'info'
             }"
             role="alert" aria-live="assertive" aria-atomic="true">
          <div class="d-flex">
            <div class="toast-body">
              <strong class="d-block mb-1">{{ toast.titulo }}</strong>
              <span>{{ toast.mensaje }}</span>
            </div>
            <button type="button" class="btn-close me-2 m-auto"
                    [class.btn-close-white]="toast.tipo === 'success' || toast.tipo === 'danger'"
                    (click)="toastService.remover(toast.id)"
                    aria-label="Cerrar"></button>
          </div>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  public toastService = inject(ToastService);
}
