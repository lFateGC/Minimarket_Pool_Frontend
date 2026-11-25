import { Injectable, computed, inject, signal } from '@angular/core';
import { ItemCarrito, Producto } from '../models';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private toastService = inject(ToastService);
  private itemsSignal = signal<ItemCarrito[]>(this.cargarCarritoStorage());
  private offcanvasAbiertoSignal = signal<boolean>(false);
  private modalCheckoutAbiertoSignal = signal<boolean>(false);
  private modalRequiereCuentaSignal = signal<boolean>(false);
  private productoPendienteSignal = signal<Producto | null>(null);
  private compraPendienteSignal = signal<boolean>(false);

  public items = this.itemsSignal.asReadonly();
  public offcanvasAbierto = this.offcanvasAbiertoSignal.asReadonly();
  public modalCheckoutAbierto = this.modalCheckoutAbiertoSignal.asReadonly();
  public modalRequiereCuentaAbierto = this.modalRequiereCuentaSignal.asReadonly();
  public productoPendiente = this.productoPendienteSignal.asReadonly();
  public compraPendiente = this.compraPendienteSignal.asReadonly();

  public totalItems = computed(() => {
    return this.itemsSignal().reduce((acc, it) => acc + it.cantidad, 0);
  });

  public subtotal = computed(() => {
    return this.itemsSignal().reduce((acc, it) => acc + (it.producto.precioUnitario * it.cantidad), 0);
  });

  public igv = computed(() => {
    return this.subtotal() * 0.18;
  });

  public total = computed(() => {
    return this.subtotal(); // El precio al consumidor ya incluye IGV en Perú
  });

  private cargarCarritoStorage(): ItemCarrito[] {
    const raw = localStorage.getItem('pool_cart');
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private guardarStorage() {
    localStorage.setItem('pool_cart', JSON.stringify(this.itemsSignal()));
  }

  agregar(producto: Producto, cantidad = 1) {
    if (producto.stockActual <= 0) {
      this.toastService.warning('Stock Agotado', `El producto ${producto.nombre} no cuenta con existencias disponibles.`);
      return;
    }

    const lista = [...this.itemsSignal()];
    const index = lista.findIndex(it => it.producto.id === producto.id);

    if (index >= 0) {
      const nuevaCantidad = lista[index].cantidad + cantidad;
      if (nuevaCantidad > producto.stockActual) {
        this.toastService.warning('Límite de Stock', `Solo hay ${producto.stockActual} unidades disponibles de ${producto.nombre}.`);
        lista[index].cantidad = producto.stockActual;
      } else {
        lista[index].cantidad = nuevaCantidad;
        this.toastService.success('Carrito Actualizado', `Se incrementó la cantidad de ${producto.nombre}.`);
      }
    } else {
      const cantidadInicial = Math.min(cantidad, producto.stockActual);
      lista.push({ producto, cantidad: cantidadInicial });
      this.toastService.success('¡Agregado!', `${producto.nombre} fue añadido al carrito.`);
    }

    this.itemsSignal.set(lista);
    this.guardarStorage();
  }

  cambiarCantidad(productoId: number, delta: number) {
    let lista = [...this.itemsSignal()];
    const item = lista.find(it => it.producto.id === productoId);
    if (!item) return;

    const nueva = item.cantidad + delta;
    if (nueva <= 0) {
      this.eliminar(productoId);
      return;
    }

    if (nueva > item.producto.stockActual) {
      this.toastService.warning('Stock Máximo', `Máximo disponible: ${item.producto.stockActual} unidades.`);
      item.cantidad = item.producto.stockActual;
    } else {
      item.cantidad = nueva;
    }

    this.itemsSignal.set(lista);
    this.guardarStorage();
  }

  eliminar(productoId: number) {
    const lista = this.itemsSignal().filter(it => it.producto.id !== productoId);
    this.itemsSignal.set(lista);
    this.guardarStorage();
  }

  vaciar() {
    this.itemsSignal.set([]);
    this.guardarStorage();
  }

  abrirOffcanvas() {
    this.offcanvasAbiertoSignal.set(true);
  }

  cerrarOffcanvas() {
    this.offcanvasAbiertoSignal.set(false);
  }

  abrirCheckout() {
    this.cerrarOffcanvas();
    this.modalCheckoutAbiertoSignal.set(true);
  }

  cerrarCheckout() {
    this.modalCheckoutAbiertoSignal.set(false);
  }

  solicitarCuentaParaComprar(producto: Producto | null = null) {
    this.productoPendienteSignal.set(producto);
    this.modalRequiereCuentaSignal.set(true);
  }

  marcarCompraPendiente(val: boolean) {
    this.compraPendienteSignal.set(val);
  }

  consumirCompraPendiente(): boolean {
    const val = this.compraPendienteSignal();
    this.compraPendienteSignal.set(false);
    return val;
  }

  cerrarRequiereCuenta() {
    this.modalRequiereCuentaSignal.set(false);
  }

  consumirProductoPendiente(): Producto | null {
    const prod = this.productoPendienteSignal();
    this.productoPendienteSignal.set(null);
    return prod;
  }
}
