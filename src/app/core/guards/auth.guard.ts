import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const personalGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (auth.isLoggedIn() && auth.isPersonal()) {
    return true;
  }

  toast.warning('Acceso Restringido', 'Debes iniciar sesión con una cuenta de Personal (Admin o Vendedor).');
  router.navigate(['/interno/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (auth.isLoggedIn() && auth.isAdmin()) {
    return true;
  }

  toast.error('Acceso Exclusivo', 'Esta sección requiere permisos de Administrador.');
  router.navigate(['/interno/dashboard']);
  return false;
};

export const clienteGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (auth.isLoggedIn() && (auth.isCliente() || auth.isAdmin())) {
    return true;
  }

  toast.info('Identificación requerida', 'Inicia sesión con tu cuenta de cliente para acceder a esta sección.');
  router.navigate(['/tienda']);
  return false;
};
