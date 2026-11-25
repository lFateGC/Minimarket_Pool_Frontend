export type Rol = 'ADMIN' | 'VENDEDOR' | 'CLIENTE';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}

export interface JwtResponse {
  token: string;
  email: string;
  nombre: string;
  rol: Rol;
  id?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegistroRequest {
  nombre: string;
  email: string;
  password: string;
}

export interface RegistroClienteRequest {
  nombres: string;
  apellidos?: string;
  tipoDocumento: string;
  numeroDocumento: string;
  email: string;
  password: string;
  telefono?: string;
  direccion?: string;
}

export interface VerificacionDocumentoResponse {
  registradoEnTienda: boolean;
  tieneCuentaWeb: boolean;
  tipoDocumento?: string;
  numeroDocumento?: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  mensaje?: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precioUnitario: number;
  precioCompra?: number;
  sku: string;
  activo: boolean;
  imagenUrl?: string;
  categoriaId?: number;
  categoriaNombre?: string;
  proveedorId?: number;
  proveedorNombre?: string;
  stockActual: number;
  stockMinimo?: number;
  fechaCreacion?: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  totalProductos?: number;
}

export interface Cliente {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos?: string;
  nombreCompleto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
  fechaRegistro?: string;
  totalCompras?: number;
  tieneCuentaWeb?: boolean;
}

export interface Proveedor {
  id: number;
  ruc: string;
  razonSocial: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
}

export interface LoteInventario {
  id: number;
  numeroLote: string;
  productoId: number;
  productoNombre: string;
  fechaVencimiento: string;
  fechaIngreso: string;
  cantidadInicial: number;
  cantidadActual: number;
  precioCompraUnitario: number;
  estadoLote?: string;
}

export interface DetalleVentaRequest {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
}

export interface VentaRequest {
  clienteId?: number | null;
  tipoComprobante?: 'BOLETA' | 'FACTURA' | 'TICKET' | string;
  numeroComprobante?: string;
  metodoPago: 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA' | string;
  montoEfectivo?: number;
  vuelto?: number;
  direccionEnvio?: string;
  items?: DetalleVentaRequest[];
  detalles: DetalleVentaRequest[];
}

export interface DetalleVentaResponse {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaResponse {
  id: number;
  numeroVenta?: string;
  tipoComprobante: string;
  numeroComprobante?: string;
  subtotal: number;
  igv: number;
  total: number;
  metodoPago: string;
  montoEfectivo?: number;
  vuelto?: number;
  estado?: string;
  fecha: string;
  clienteId?: number;
  clienteNombre?: string;
  clienteNumeroDocumento?: string;
  clienteDireccion?: string;
  vendedorId?: number;
  vendedorNombre?: string;
  direccionEnvio?: string;
  detalles: DetalleVentaResponse[];
}

export interface EstadoCajaResponse {
  cajaAbierta: boolean;
  sesionId?: number;
  fechaApertura?: string;
  montoApertura?: number;
  usuarioNombre?: string;
  totalIngresos?: number;
  totalEgresos?: number;
  totalVentasEfectivo?: number;
  totalVentasDigital?: number;
  saldoCalculado?: number;
}

export interface AperturaCajaRequest {
  montoInicial?: number;
  montoApertura?: number;
  observaciones?: string;
}

export interface CierreCajaRequest {
  montoFinalReal?: number;
  montoCierreReal?: number;
  observaciones?: string;
}

export interface MovimientoCajaRequest {
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  motivo: string;
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}
