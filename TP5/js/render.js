import { solicitud, planes, obtenerPlanActual } from './estado.js';
import { calcularCuota, formatearMoneda } from './cotizador.js';
import {
  validarPaso1,
  validarPaso3,
  validarPaso4,
  obtenerErroresPaso3,
} from './validaciones.js';

const ETIQUETAS_ANTIGUEDAD = {
  menos_1: 'Menos de 1 año',
  '1_a_2': '1 a 2 años',
  mas_2: 'Más de 2 años',
};

const TEXTOS_AYUDA_BASE = {
  marca: 'Elegí el fabricante de tu celular.',
  modelo: 'Mínimo 2 caracteres.',
  valorEquipo: 'El valor debe estar entre $100.000 y $2.500.000.',
  antiguedad: 'Seleccioná cuánto tiempo de uso tiene el celular.',
  nombre: 'Tal como figura en tu DNI.',
  apellido: 'Tal como figura en tu DNI.',
  dni: '7 u 8 dígitos sin puntos.',
  fechaNacimiento: 'Debés ser mayor de 18 años.',
  email: 'Aquí enviaremos tu póliza digital.',
  celular: 'Código de área + número (10 dígitos, sin 0 ni 15).',
  aceptaTerminos: '',
  numeroTarjeta: 'Ingresá los 16 dígitos del frente de tu tarjeta.',
  vencimiento: 'Mes y año de expiración (ej: 08/28).',
  cvv: '3 dígitos al dorso de la tarjeta.',
  titularTarjeta: 'Exactamente como está impreso en el plástico.',
};

/**
 * Muestra o limpia el error en línea de un campo aplicando las reglas de Basecoat UI y accesibilidad:
 * - .field lleva data-invalid
 * - input/select lleva aria-invalid="true" y aria-describedby="error-..."
 * - <p id="error-..." role="alert"> muestra el mensaje
 */
export function renderErrorCampo(nombreCampo, mensajeError) {
  const field = document.getElementById(`field-${nombreCampo}`);
  const parrafo = document.getElementById(`error-${nombreCampo}`);
  const input = document.getElementById(nombreCampo);

  if (!field || !parrafo) return;

  if (mensajeError) {
    field.setAttribute('data-invalid', '');
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', parrafo.id);
    }
    parrafo.setAttribute('role', 'alert');
    parrafo.classList.remove('text-slate-500');
    parrafo.classList.add('text-red-600', 'font-semibold');
    parrafo.textContent = mensajeError;
  } else {
    field.removeAttribute('data-invalid');
    if (input) {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
    parrafo.removeAttribute('role');
    parrafo.classList.remove('text-red-600', 'font-semibold');
    parrafo.classList.add('text-slate-500');
    parrafo.textContent = TEXTOS_AYUDA_BASE[nombreCampo] ?? '';
  }
}

/**
 * Actualiza el estado habilitado/deshabilitado de los botones de avance
 * ("Ver planes", "Continuar al pago" y "Pagar y contratar")
 * y la explicación de qué falta en el Paso 3.
 */
export function renderEstadoBotones() {
  const btnPaso1 = document.getElementById('btn-continuar-1');
  if (btnPaso1) {
    btnPaso1.disabled = !validarPaso1();
  }

  const btnPaso3 = document.getElementById('btn-continuar-3');
  const ayudaPaso3 = document.getElementById('ayuda-boton-paso-3');
  const paso3Valido = validarPaso3();

  if (btnPaso3) {
    btnPaso3.disabled = !paso3Valido;
  }

  if (ayudaPaso3) {
    if (paso3Valido) {
      ayudaPaso3.hidden = true;
    } else {
      ayudaPaso3.hidden = false;
      const errores = obtenerErroresPaso3();
      const etiquetasFaltantes = {
        nombre: 'Nombre',
        apellido: 'Apellido',
        dni: 'DNI',
        fechaNacimiento: 'Fecha de nacimiento (+18)',
        email: 'Email',
        celular: 'Celular',
        aceptaTerminos: 'Aceptar términos',
      };
      const pendientes = Object.entries(errores)
        .filter(([, err]) => err !== null)
        .map(([clave]) => etiquetasFaltantes[clave]);

      ayudaPaso3.textContent = `Falta completar o corregir: ${pendientes.join(', ')}.`;
    }
  }

  const btnPagar = document.getElementById('btn-pagar');
  if (btnPagar && btnPagar.dataset.procesando !== 'true') {
    btnPagar.disabled = !validarPaso4();
  }
}

/**
 * Muestra u oculta cada sección según solicitud.paso,
 * sincroniza los valores de los inputs desde el estado y actualiza Stepper y Resumen.
 */
export function render() {
  document.querySelectorAll('[data-paso]').forEach((s) => {
    s.hidden = Number(s.dataset.paso) !== solicitud.paso;
  });

  const layoutCheckout = document.getElementById('layout-checkout');
  if (layoutCheckout) {
    layoutCheckout.hidden = solicitud.paso < 1 || solicitud.paso > 4;
  }

  sincronizarInputsDesdeEstado();
  renderPlanes();
  renderStepper();
  renderResumen();
  renderEstadoBotones();
  renderPantallasFinales();
}

/**
 * Rellena los inputs del DOM leyendo desde solicitud para no perder datos al navegar con "Volver" o recargar con F5
 */
function sincronizarInputsDesdeEstado() {
  // Paso 1: Equipo
  const selectMarca = document.getElementById('marca');
  if (selectMarca && selectMarca.value !== solicitud.equipo.marca) {
    selectMarca.value = solicitud.equipo.marca;
  }

  const inputModelo = document.getElementById('modelo');
  if (inputModelo && document.activeElement !== inputModelo) {
    inputModelo.value = solicitud.equipo.modelo;
  }

  const inputValor = document.getElementById('valorEquipo');
  if (inputValor && document.activeElement !== inputValor) {
    inputValor.value =
      solicitud.equipo.valor > 0
        ? solicitud.equipo.valor.toLocaleString('es-AR')
        : '';
  }

  document.querySelectorAll('input[name="antiguedad"]').forEach((radio) => {
    radio.checked = radio.value === solicitud.equipo.antiguedad;
  });

  // Paso 2: Plan seleccionado
  document.querySelectorAll('input[name="plan"]').forEach((radio) => {
    radio.checked = radio.value === solicitud.plan;
  });

  // Paso 3: Datos personales del titular
  const camposTitular = [
    ['nombre', solicitud.titular.nombre],
    ['apellido', solicitud.titular.apellido],
    ['dni', solicitud.titular.dni],
    ['fechaNacimiento', solicitud.titular.nacimiento],
    ['email', solicitud.titular.email],
    ['celular', solicitud.titular.celular],
  ];

  camposTitular.forEach(([id, valor]) => {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el) {
      el.value = valor || '';
    }
  });

  const checkTerminos = document.getElementById('aceptaTerminos');
  if (checkTerminos) {
    checkTerminos.checked = Boolean(solicitud.titular.terminos);
  }

  // Paso 4: Datos de pago
  document.querySelectorAll('input[name="medioPago"]').forEach((radio) => {
    radio.checked = radio.value === solicitud.pago.metodo;
  });

  const camposPago = [
    ['numeroTarjeta', solicitud.pago.tarjeta],
    ['vencimiento', solicitud.pago.vencimiento],
    ['cvv', solicitud.pago.cvv],
    ['titularTarjeta', solicitud.pago.titular],
  ];

  camposPago.forEach(([id, valor]) => {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el) {
      el.value = valor || '';
    }
  });
}

/**
 * Pinta las 3 cards de planes en el Paso 2 con sus cuotas calculadas desde solicitud
 */
export function renderPlanes() {
  const contenedor = document.getElementById('contenedor-planes');
  if (!contenedor) return;

  const { valor, antiguedad } = solicitud.equipo;

  contenedor.innerHTML = planes
    .map((plan) => {
      const cuota = calcularCuota(valor, plan.tasaAnual, antiguedad);
      const seleccionado = solicitud.plan === plan.id;
      const badgeRecomendado = plan.recomendado
        ? '<span class="badge bg-indigo-600 text-white text-[11px]">Recomendado</span>'
        : '';

      const clasesCard = seleccionado
        ? 'border-indigo-600 bg-indigo-50/40'
        : 'border-slate-200 bg-white';

      const itemsCobertura = plan.coberturas
        .map(
          (cob) => `
            <li class="flex items-center gap-2">
              <span class="text-emerald-600 font-bold" aria-hidden="true">✓</span>
              <span>${cob}</span>
            </li>`
        )
        .join('');

      return `
        <label for="plan-${plan.id}" class="cursor-pointer block">
          <input
            type="radio"
            id="plan-${plan.id}"
            name="plan"
            value="${plan.id}"
            class="peer sr-only"
            ${seleccionado ? 'checked' : ''}
          >
          <div class="card h-full p-5 border-2 ${clasesCard} rounded-xl flex flex-col justify-between transition-all hover:border-indigo-300 peer-checked:border-indigo-600 peer-checked:bg-indigo-50/40">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <h2 class="text-lg font-extrabold text-slate-900">${plan.nombre}</h2>
                ${badgeRecomendado}
              </div>
              <p class="text-2xl font-extrabold text-slate-900">
                ${cuota > 0 ? formatearMoneda(cuota) : '$ —'}
                <span class="text-xs font-normal text-slate-500">/mes</span>
              </p>
              <p class="text-[11px] text-slate-500 mt-1">Tasa anual: ${Math.round(plan.tasaAnual * 100)}%</p>
              <ul class="mt-4 space-y-2 text-xs text-slate-600">
                ${itemsCobertura}
              </ul>
            </div>
          </div>
        </label>
      `;
    })
    .join('');
}

/**
 * Muestra el stepper en los pasos 1 a 4 y actualiza sus estados:
 * - completo (< solicitud.paso): emerald-600
 * - activo (=== solicitud.paso): indigo-600
 * - pendiente (> solicitud.paso): slate-500
 */
export function renderStepper() {
  const stepper = document.getElementById('stepper');
  if (!stepper) return;

  const visible = solicitud.paso >= 1 && solicitud.paso <= 4;
  stepper.hidden = !visible;
  if (!visible) return;

  document.querySelectorAll('[data-stepper-paso]').forEach((item) => {
    const numPaso = Number(item.dataset.stepperPaso);
    const indicador = item.querySelector('[data-stepper-indicador]');

    item.classList.remove('text-emerald-600', 'text-indigo-600', 'text-slate-500', 'font-semibold');
    if (indicador) {
      indicador.classList.remove(
        'bg-emerald-600',
        'bg-indigo-600',
        'bg-slate-100',
        'text-white',
        'text-slate-500'
      );
    }

    if (numPaso < solicitud.paso) {
      item.classList.add('text-emerald-600', 'font-semibold');
      if (indicador) {
        indicador.classList.add('bg-emerald-600', 'text-white');
        indicador.textContent = '✓';
      }
    } else if (numPaso === solicitud.paso) {
      item.classList.add('text-indigo-600', 'font-semibold');
      if (indicador) {
        indicador.classList.add('bg-indigo-600', 'text-white');
        indicador.textContent = String(numPaso);
      }
    } else {
      item.classList.add('text-slate-500');
      if (indicador) {
        indicador.classList.add('bg-slate-100', 'text-slate-500');
        indicador.textContent = String(numPaso);
      }
    }
  });
}

/**
 * Actualiza el único componente #resumen-compra (visible en pasos 2, 3 y 4)
 * y el resumen detallado del Paso 4 leyendo exclusivamente desde solicitud.
 */
export function renderResumen() {
  const asideResumen = document.getElementById('resumen-compra');
  if (!asideResumen) return;

  const mostrarResumen = solicitud.paso >= 2 && solicitud.paso <= 4;
  asideResumen.hidden = !mostrarResumen;

  const planActual = obtenerPlanActual();
  const { marca, modelo, valor, antiguedad } = solicitud.equipo;
  const cuota = planActual
    ? calcularCuota(valor, planActual.tasaAnual, antiguedad)
    : 0;

  const nombreEquipo = [marca, modelo].filter(Boolean).join(' ').trim() || 'Completá los datos del equipo';
  const textoValor = valor > 0 ? formatearMoneda(valor) : '—';
  const textoCuota = cuota > 0 ? formatearMoneda(cuota) : '$ —';
  const textoAntiguedad = ETIQUETAS_ANTIGUEDAD[antiguedad] || '—';

  const elTitulo = document.getElementById('resumen-equipo-titulo');
  if (elTitulo) elTitulo.textContent = nombreEquipo;

  const elCuota = document.getElementById('resumen-cuota-valor');
  if (elCuota) {
    elCuota.innerHTML = `${textoCuota}<span class="text-xs font-normal text-slate-500">/mes</span>`;
  }

  const elSuma = document.getElementById('resumen-suma-asegurada');
  if (elSuma) elSuma.textContent = textoValor;

  const elAntiguedad = document.getElementById('resumen-antiguedad');
  if (elAntiguedad) elAntiguedad.textContent = textoAntiguedad;

  const elPlanNombre = document.getElementById('resumen-plan-nombre');
  if (elPlanNombre) elPlanNombre.textContent = planActual ? planActual.nombre : 'Plus';

  const elCoberturas = document.getElementById('resumen-coberturas-lista');
  if (elCoberturas && planActual) {
    elCoberturas.innerHTML = planActual.coberturas
      .map((c) => `<p>• ${c}</p>`)
      .join('');
  }

  // Bloque de resumen dentro del Paso 4 (Pago)
  const pagoPlan = document.getElementById('pago-resumen-plan');
  if (pagoPlan) pagoPlan.textContent = `Plan ${planActual ? planActual.nombre : 'Plus'}`;

  const pagoEquipo = document.getElementById('pago-resumen-equipo');
  if (pagoEquipo) pagoEquipo.textContent = nombreEquipo;

  const pagoValor = document.getElementById('pago-resumen-valor');
  if (pagoValor) pagoValor.textContent = textoValor;

  const nombreCompletoTitular = [solicitud.titular.nombre, solicitud.titular.apellido]
    .filter(Boolean)
    .join(' ')
    .trim();
  const pagoTitular = document.getElementById('pago-resumen-titular');
  if (pagoTitular) {
    pagoTitular.textContent = nombreCompletoTitular
      ? `${nombreCompletoTitular} (DNI ${solicitud.titular.dni || '—'})`
      : '—';
  }

  const pagoCuota = document.getElementById('pago-resumen-cuota');
  if (pagoCuota) pagoCuota.textContent = `${textoCuota}/mes`;
}

/**
 * Actualiza los textos dinámicos de las pantallas finales (Paso 5 Éxito y Paso 6 Error) desde solicitud
 */
function renderPantallasFinales() {
  if (solicitud.paso === 6) {
    const elErrorMsg = document.getElementById('error-pago-mensaje');
    if (elErrorMsg) {
      const limpio = String(solicitud.pago.tarjeta || '').replace(/\s/g, '');
      const ultimos4 = limpio.slice(-4) || '0002';
      elErrorMsg.textContent = `Tarjeta rechazada: la numeración terminada en ${ultimos4} no fue autorizada por la entidad emisora. Podés reintentar el pago o elegir otro medio de pago.`;
    }
    return;
  }

  if (solicitud.paso !== 5) return;

  const planActual = obtenerPlanActual();
  const { marca, modelo, valor, antiguedad } = solicitud.equipo;
  const cuota = planActual ? calcularCuota(valor, planActual.tasaAnual, antiguedad) : 0;
  const nombreTitular = [solicitud.titular.nombre, solicitud.titular.apellido].filter(Boolean).join(' ').trim() || 'Titular';

  const elNombre = document.getElementById('exito-nombre-titular');
  if (elNombre) elNombre.textContent = nombreTitular;

  const elEmail = document.getElementById('exito-email-titular');
  if (elEmail) elEmail.textContent = solicitud.titular.email || '—';

  const elPoliza = document.getElementById('exito-numero-poliza');
  if (elPoliza) elPoliza.textContent = solicitud.poliza || 'POL-2026-000001';

  const elEquipo = document.getElementById('exito-equipo');
  if (elEquipo) elEquipo.textContent = [marca, modelo].filter(Boolean).join(' ') || '—';

  const elPlan = document.getElementById('exito-plan');
  if (elPlan) elPlan.textContent = planActual ? `Plan ${planActual.nombre}` : '—';

  const elSuma = document.getElementById('exito-suma');
  if (elSuma) elSuma.textContent = valor > 0 ? formatearMoneda(valor) : '—';

  const elCuota = document.getElementById('exito-cuota');
  if (elCuota) elCuota.textContent = cuota > 0 ? `${formatearMoneda(cuota)}/mes` : '—';
}
