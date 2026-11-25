import { Routes } from '@angular/router';
import { personalGuard, adminGuard, clienteGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tienda',
    pathMatch: 'full'
  },
  {
    path: 'tienda',
    loadComponent: () =>
      import('./features/externo/pages/tienda-home.component').then(m => m.TiendaHomeComponent)
  },
  {
    path: 'tienda/mi-cuenta',
    loadComponent: () =>
      import('./features/externo/pages/mi-cuenta.component').then(m => m.MiCuentaComponent),
    canActivate: [clienteGuard]
  },
  {
    path: 'mi-cuenta',
    redirectTo: 'tienda/mi-cuenta',
    pathMatch: 'full'
  },
  {
    path: 'interno/login',
    loadComponent: () =>
      import('./features/interno/pages/login-interno.component').then(m => m.LoginInternoComponent)
  },
  {
    path: 'interno',
    loadComponent: () =>
      import('./features/interno/pages/interno-layout.component').then(m => m.InternoLayoutComponent),
    canActivate: [personalGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/interno/pages/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'pos',
        loadComponent: () =>
          import('./features/interno/pages/pos.component').then(m => m.PosComponent)
      },
      {
        path: 'catalogo',
        loadComponent: () =>
          import('./features/interno/pages/catalogo.component').then(m => m.CatalogoComponent)
      },
      {
        path: 'inventario',
        loadComponent: () =>
          import('./features/interno/pages/inventario.component').then(m => m.InventarioComponent)
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/interno/pages/clientes.component').then(m => m.ClientesComponent)
      },
      {
        path: 'caja',
        loadComponent: () =>
          import('./features/interno/pages/caja.component').then(m => m.CajaComponent)
      },
      {
        path: 'proveedores',
        loadComponent: () =>
          import('./features/interno/pages/proveedores.component').then(m => m.ProveedoresComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./features/interno/pages/categorias.component').then(m => m.CategoriasComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/interno/pages/reportes.component').then(m => m.ReportesComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/interno/pages/usuarios.component').then(m => m.UsuariosComponent),
        canActivate: [adminGuard]
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'tienda'
  }
];
