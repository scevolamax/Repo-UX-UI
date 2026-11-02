import {
  solicitud,
  setPlanes,
  irAPaso,
  reiniciarSolicitud,
  guardarEstado,
  cargarEstadoPersistido,
  limpiarEstadoPersistido,
} from './estado.js';
import {
  render,
  renderResumen,
  renderErrorCampo,
  renderEstadoBotones,
} from './render.js';
import {
  validarMarca,
  validarModelo,
  validarValorEquipo,
  validarAntiguedad,
  validarNombre,
  validarApellido,
  validarDni,
  validarFechaNacimiento,
  validarEmail,
  validarCelular,
  validarTerminos,
  validarTarjeta,
  validarVencimiento,
  validarCvv,
  validarTitularTarjeta,
  validarPaso1,
  validarPaso3,
  validarPaso4,
  obtenerErroresPaso1,
  obtenerErroresPaso3,
  obtenerErroresPaso4,
} from './validaciones.js';
import { simularPago, generarPoliza } from './pago.js';

// ==========================================
// MÁSCARAS AUTOMÁTICAS DE INPUT (BONUS)
// ==========================================

function aplicarMascaraMiles(valorCrudo) {
  const digitos = String(valorCrudo ?? '').replace(/\D/g, '').slice(0, 7);
  if (!digitos) return { formateado: '', numero: 0 };
  const numero = Number(digitos);
  return {
    formateado: numero.toLocaleString('es-AR'),
    numero,
  };
}

function aplicarMascaraTarjeta(valorCrudo) {
  const digitos = String(valorCrudo ?? '').replace(/\D/g, '').slice(0, 16);
  const grupos = digitos.match(/.{1,4}/g);
  return grupos ? grupos.join(' ') : '';
}

function aplicarMascaraVencimiento(valorCrudo) {
  const digitos = String(valorCrudo ?? '').replace(/\D/g, '').slice(0, 4);
  if (digitos.length >= 3) {
    return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}`;
  }
  return digitos;
}

async function cargarPlanes() {
  try {
    const respuesta = await fetch('data/planes.json');
    if (respuesta.ok) {
      const datos = await respuesta.json();
      setPlanes(datos);
    }
  } catch {
    // Si se abre por file:// o falla la red, se mantiene el catálogo base en memoria
  }
}

function enfocarPrimerError(errores) {
  const primerCampoConError = Object.keys(errores).find((campo) => errores[campo] !== null);
  if (!primerCampoConError) return;

  if (primerCampoConError === 'antiguedad') {
    const radio = document.querySelector('input[name="antiguedad"]');
    if (radio) radio.focus();
    return;
  }

  const el = document.getElementById(primerCampoConError);
  if (el) el.focus();
}

function inicializarEventos() {
  // Inicio -> Paso 1
  const btnIniciar = document.getElementById('btn-iniciar-celular');
  if (btnIniciar) {
    btnIniciar.addEventListener('click', () => irAPaso(1));
  }

  const logoInicio = document.getElementById('logo-inicio');
  if (logoInicio) {
    logoInicio.addEventListener('click', (e) => {
      e.preventDefault();
      irAPaso(0);
    });
  }

  // Botones "Volver" (Pasos 1 a 4)
  document.querySelectorAll('[data-action="volver"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (solicitud.paso > 0) {
        irAPaso(solicitud.paso - 1);
      }
    });
  });

  // Bonus: Links "Editar" desde el resumen del Paso 4
  document.querySelectorAll('[data-editar-paso]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pasoDestino = Number(btn.dataset.editarPaso);
      if (pasoDestino >= 1 && pasoDestino <= 3) {
        irAPaso(pasoDestino);
      }
    });
  });

  // ==========================================
  // PASO 1: COTIZAR EQUIPO
  // ==========================================
  const formPaso1 = document.getElementById('form-paso-1');
  if (formPaso1) {
    const actualizarEstadoPaso1 = (target) => {
      if (target.id === 'marca') {
        solicitud.equipo.marca = target.value;
        renderErrorCampo('marca', validarMarca(solicitud.equipo.marca));
      }
      if (target.id === 'modelo') {
        solicitud.equipo.modelo = target.value.trim();
        if (validarModelo(solicitud.equipo.modelo) === null) {
          renderErrorCampo('modelo', null);
        }
      }
      if (target.id === 'valorEquipo') {
        const { formateado, numero } = aplicarMascaraMiles(target.value);
        target.value = formateado;
        solicitud.equipo.valor = numero;
        if (validarValorEquipo(numero) === null) {
          renderErrorCampo('valorEquipo', null);
        }
      }
      if (target.name === 'antiguedad') {
        solicitud.equipo.antiguedad = target.value;
        renderErrorCampo('antiguedad', validarAntiguedad(solicitud.equipo.antiguedad));
      }

      guardarEstado();
      renderEstadoBotones();
    };

    formPaso1.addEventListener('input', (e) => actualizarEstadoPaso1(e.target));
    formPaso1.addEventListener('change', (e) => actualizarEstadoPaso1(e.target));

    // Validación en línea al salir de cada campo (blur)
    formPaso1.addEventListener(
      'blur',
      (e) => {
        const t = e.target;
        if (t.id === 'marca') renderErrorCampo('marca', validarMarca(t.value));
        if (t.id === 'modelo') renderErrorCampo('modelo', validarModelo(t.value));
        if (t.id === 'valorEquipo') renderErrorCampo('valorEquipo', validarValorEquipo(t.value));
      },
      true
    );

    formPaso1.addEventListener('submit', (e) => {
      e.preventDefault();
      const errores = obtenerErroresPaso1();
      Object.entries(errores).forEach(([campo, error]) => renderErrorCampo(campo, error));

      if (!validarPaso1()) {
        enfocarPrimerError(errores);
        return;
      }
      irAPaso(2);
    });
  }

  // ==========================================
  // PASO 2: ELEGIR PLAN
  // ==========================================
  const formPaso2 = document.getElementById('form-paso-2');
  if (formPaso2) {
    formPaso2.addEventListener('change', (e) => {
      if (e.target.name === 'plan') {
        solicitud.plan = e.target.value;
        guardarEstado();
        render();
      }
    });

    formPaso2.addEventListener('submit', (e) => {
      e.preventDefault();
      irAPaso(3);
    });
  }

  // ==========================================
  // PASO 3: DATOS PERSONALES
  // ==========================================
  const formPaso3 = document.getElementById('form-paso-3');
  if (formPaso3) {
    const validadoresPaso3 = {
      nombre: () => validarNombre(solicitud.titular.nombre),
      apellido: () => validarApellido(solicitud.titular.apellido),
      dni: () => validarDni(solicitud.titular.dni),
      fechaNacimiento: () => validarFechaNacimiento(solicitud.titular.nacimiento),
      email: () => validarEmail(solicitud.titular.email),
      celular: () => validarCelular(solicitud.titular.celular),
      aceptaTerminos: () => validarTerminos(solicitud.titular.terminos),
    };

    const actualizarEstadoPaso3 = (t) => {
      if (t.id === 'nombre') solicitud.titular.nombre = t.value.trim();
      if (t.id === 'apellido') solicitud.titular.apellido = t.value.trim();
      if (t.id === 'dni') {
        t.value = t.value.replace(/\D/g, '').slice(0, 8);
        solicitud.titular.dni = t.value;
      }
      if (t.id === 'fechaNacimiento') solicitud.titular.nacimiento = t.value;
      if (t.id === 'email') solicitud.titular.email = t.value.trim();
      if (t.id === 'celular') solicitud.titular.celular = t.value.trim();
      if (t.id === 'aceptaTerminos') {
        solicitud.titular.terminos = t.checked;
        renderErrorCampo('aceptaTerminos', validarTerminos(t.checked));
      }

      if (validadoresPaso3[t.id] && validadoresPaso3[t.id]() === null) {
        renderErrorCampo(t.id, null);
      }

      guardarEstado();
      renderEstadoBotones();
    };

    formPaso3.addEventListener('input', (e) => actualizarEstadoPaso3(e.target));
    formPaso3.addEventListener('change', (e) => actualizarEstadoPaso3(e.target));

    formPaso3.addEventListener(
      'blur',
      (e) => {
        const id = e.target.id;
        if (validadoresPaso3[id]) {
          renderErrorCampo(id, validadoresPaso3[id]());
        }
      },
      true
    );

    formPaso3.addEventListener('submit', (e) => {
      e.preventDefault();
      const errores = obtenerErroresPaso3();
      Object.entries(errores).forEach(([campo, error]) => renderErrorCampo(campo, error));

      if (!validarPaso3()) {
        enfocarPrimerError(errores);
        return;
      }
      irAPaso(4);
    });
  }

  // ==========================================
  // PASO 4: PAGO Y CONTRATACIÓN
  // ==========================================
  const formPaso4 = document.getElementById('form-paso-4');
  if (formPaso4) {
    const validadoresPaso4 = {
      numeroTarjeta: () => validarTarjeta(solicitud.pago.tarjeta),
      vencimiento: () => validarVencimiento(solicitud.pago.vencimiento),
      cvv: () => validarCvv(solicitud.pago.cvv),
      titularTarjeta: () => validarTitularTarjeta(solicitud.pago.titular),
    };

    const actualizarEstadoPaso4 = (t) => {
      if (t.name === 'medioPago') {
        solicitud.pago.metodo = t.value;
      }
      if (t.id === 'numeroTarjeta') {
        t.value = aplicarMascaraTarjeta(t.value);
        solicitud.pago.tarjeta = t.value;
      }
      if (t.id === 'vencimiento') {
        t.value = aplicarMascaraVencimiento(t.value);
        solicitud.pago.vencimiento = t.value;
      }
      if (t.id === 'cvv') {
        t.value = t.value.replace(/\D/g, '').slice(0, 3);
        solicitud.pago.cvv = t.value;
      }
      if (t.id === 'titularTarjeta') {
        solicitud.pago.titular = t.value.trim();
      }

      if (validadoresPaso4[t.id] && validadoresPaso4[t.id]() === null) {
        renderErrorCampo(t.id, null);
      }

      guardarEstado();
      renderEstadoBotones();
      renderResumen();
    };

    formPaso4.addEventListener('input', (e) => actualizarEstadoPaso4(e.target));
    formPaso4.addEventListener('change', (e) => actualizarEstadoPaso4(e.target));

    formPaso4.addEventListener(
      'blur',
      (e) => {
        const id = e.target.id;
        if (validadoresPaso4[id]) {
          renderErrorCampo(id, validadoresPaso4[id]());
        }
      },
      true
    );

    formPaso4.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errores = obtenerErroresPaso4();
      Object.entries(errores).forEach(([campo, error]) => renderErrorCampo(campo, error));

      if (!validarPaso4()) {
        enfocarPrimerError(errores);
        return;
      }

      const btnPagar = document.getElementById('btn-pagar');
      const btnVolver4 = document.getElementById('btn-volver-4');

      // a) Deshabilitar inmediatamente el botón y mostrar "Procesando..." para evitar doble pago
      if (btnPagar) {
        btnPagar.dataset.procesando = 'true';
        btnPagar.disabled = true;
        btnPagar.textContent = 'Procesando...';
      }
      if (btnVolver4) {
        btnVolver4.disabled = true;
      }

      try {
        // b) Simular pago durante 1,5 segundos
        const resultado = await simularPago(solicitud.pago.tarjeta);

        if (btnPagar) {
          btnPagar.dataset.procesando = 'false';
          btnPagar.textContent = 'Pagar y contratar';
        }
        if (btnVolver4) {
          btnVolver4.disabled = false;
        }

        // c) Si es aprobado -> generar póliza, limpiar borrador en localStorage e ir al Paso 5 (Éxito)
        if (resultado.ok) {
          solicitud.poliza = generarPoliza();
          limpiarEstadoPersistido();
          irAPaso(5);
        } else {
          // d) Si es rechazado -> restaurar botón e ir al Paso 6 (Error) conservando los datos
          renderEstadoBotones();
          irAPaso(6);
        }
      } catch {
        if (btnPagar) {
          btnPagar.dataset.procesando = 'false';
          btnPagar.textContent = 'Pagar y contratar';
          renderEstadoBotones();
        }
        if (btnVolver4) {
          btnVolver4.disabled = false;
        }
        irAPaso(6);
      }
    });
  }

  // ==========================================
  // PASO 5: ÉXITO -> VOLVER AL INICIO
  // ==========================================
  const btnVolverInicio = document.getElementById('btn-volver-inicio');
  if (btnVolverInicio) {
    btnVolverInicio.addEventListener('click', () => {
      // Limpiar cualquier estado visual de error previo y reiniciar solicitud
      [
        'marca',
        'modelo',
        'valorEquipo',
        'antiguedad',
        'nombre',
        'apellido',
        'dni',
        'fechaNacimiento',
        'email',
        'celular',
        'aceptaTerminos',
        'numeroTarjeta',
        'vencimiento',
        'cvv',
        'titularTarjeta',
      ].forEach((campo) => renderErrorCampo(campo, null));

      reiniciarSolicitud();
    });
  }

  // ==========================================
  // PASO 6: ERROR DE PAGO -> REINTENTAR O CAMBIAR MEDIO
  // ==========================================
  const btnReintentar = document.getElementById('btn-reintentar-pago');
  if (btnReintentar) {
    btnReintentar.addEventListener('click', () => {
      irAPaso(4);
      const inputTarjeta = document.getElementById('numeroTarjeta');
      if (inputTarjeta) inputTarjeta.focus();
    });
  }

  const btnCambiarMedio = document.getElementById('btn-cambiar-medio');
  if (btnCambiarMedio) {
    btnCambiarMedio.addEventListener('click', () => {
      // Alternar o enfocar el selector de medio de pago manteniendo los datos intactos
      irAPaso(4);
      const radioMedio =
        solicitud.pago.metodo === 'credito'
          ? document.getElementById('medio-debito')
          : document.getElementById('medio-credito');
      if (radioMedio) {
        radioMedio.checked = true;
        solicitud.pago.metodo = radioMedio.value;
        guardarEstado();
        radioMedio.focus();
      }
    });
  }
}

async function init() {
  cargarEstadoPersistido();
  await cargarPlanes();
  inicializarEventos();
  render();
}

init();
