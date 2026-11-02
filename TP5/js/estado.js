import { render } from './render.js';

const STORAGE_KEY = 'cubri_seguros_solicitud_v1';

export const solicitud = {
  paso: 0, // 0 = inicio, 1..4 = checkout, 5 = éxito, 6 = error
  equipo: { marca: '', modelo: '', valor: 0, antiguedad: '' },
  plan: 'plus',
  titular: { nombre: '', apellido: '', dni: '', nacimiento: '', email: '', celular: '', terminos: false },
  pago: { metodo: 'credito', tarjeta: '', vencimiento: '', cvv: '', titular: '' },
  poliza: null,
};

// Catálogo de planes cargado desde data/planes.json
export const planes = [
  { id: 'basico', nombre: 'Básico', tasaAnual: 0.04, coberturas: ['Robo con violencia'] },
  { id: 'plus', nombre: 'Plus', tasaAnual: 0.06, recomendado: true, coberturas: ['Robo con violencia', 'Rotura de pantalla'] },
  { id: 'premium', nombre: 'Premium', tasaAnual: 0.09, coberturas: ['Robo con violencia', 'Rotura total', 'Hurto / pérdida'] },
];

export function setPlanes(listaPlanes) {
  if (Array.isArray(listaPlanes) && listaPlanes.length > 0) {
    planes.splice(0, planes.length, ...listaPlanes);
  }
}

export function obtenerPlanActual() {
  return planes.find((p) => p.id === solicitud.plan) || planes[1] || planes[0];
}

export function guardarEstado() {
  try {
    // Si la solicitud ya finalizó en éxito (paso 5), se limpia la persistencia del borrador
    if (solicitud.paso === 5) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(solicitud));
  } catch {
    // Ignorar errores de cuota o modo privado
  }
}

export function cargarEstadoPersistido() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (!guardado) return;

    const datos = JSON.parse(guardado);
    if (!datos || typeof datos !== 'object') return;

    // Siempre iniciar en la pantalla de selección de seguro (Paso 0) al abrir el sitio
    solicitud.paso = 0;
    if (datos.equipo && typeof datos.equipo === 'object') {
      solicitud.equipo = {
        marca: String(datos.equipo.marca ?? ''),
        modelo: String(datos.equipo.modelo ?? ''),
        valor: Number(datos.equipo.valor) || 0,
        antiguedad: String(datos.equipo.antiguedad ?? ''),
      };
    }
    if (typeof datos.plan === 'string' && datos.plan) {
      solicitud.plan = datos.plan;
    }
    if (datos.titular && typeof datos.titular === 'object') {
      solicitud.titular = {
        nombre: String(datos.titular.nombre ?? ''),
        apellido: String(datos.titular.apellido ?? ''),
        dni: String(datos.titular.dni ?? ''),
        nacimiento: String(datos.titular.nacimiento ?? ''),
        email: String(datos.titular.email ?? ''),
        celular: String(datos.titular.celular ?? ''),
        terminos: Boolean(datos.titular.terminos),
      };
    }
    if (datos.pago && typeof datos.pago === 'object') {
      solicitud.pago = {
        metodo: datos.pago.metodo === 'debito' ? 'debito' : 'credito',
        tarjeta: String(datos.pago.tarjeta ?? ''),
        vencimiento: String(datos.pago.vencimiento ?? ''),
        cvv: String(datos.pago.cvv ?? ''),
        titular: String(datos.pago.titular ?? ''),
      };
    }
    solicitud.poliza = datos.poliza ?? null;
  } catch {
    // Si el JSON guardado está corrupto, iniciar con el estado limpio
  }
}

export function limpiarEstadoPersistido() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignorar errores de almacenamiento
  }
}

export function irAPaso(n) {
  solicitud.paso = Number(n);
  guardarEstado();
  render();
}

export function reiniciarSolicitud() {
  solicitud.paso = 0;
  solicitud.equipo = { marca: '', modelo: '', valor: 0, antiguedad: '' };
  solicitud.plan = 'plus';
  solicitud.titular = {
    nombre: '',
    apellido: '',
    dni: '',
    nacimiento: '',
    email: '',
    celular: '',
    terminos: false,
  };
  solicitud.pago = {
    metodo: 'credito',
    tarjeta: '',
    vencimiento: '',
    cvv: '',
    titular: '',
  };
  solicitud.poliza = null;
  limpiarEstadoPersistido();
  render();
}
