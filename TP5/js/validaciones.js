import { solicitud } from './estado.js';

// ==========================================
// FUNCIONES PURAS DE VALIDACIÓN POR CAMPO
// Reciben un valor y devuelven string de error o null
// ==========================================

export function validarMarca(valor) {
  const limpio = String(valor ?? '').trim();
  return limpio.length > 0 ? null : 'Elegí una marca';
}

export function validarModelo(valor) {
  const limpio = String(valor ?? '').trim();
  return limpio.length >= 2 && limpio.length <= 40
    ? null
    : 'Ingresá el modelo del equipo';
}

export function validarValorEquipo(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '');
  const numero = Number(digitos);
  if (!digitos || Number.isNaN(numero) || numero < 100000 || numero > 2500000) {
    return 'El valor debe estar entre $100.000 y $2.500.000';
  }
  return null;
}

export function validarAntiguedad(valor) {
  const opcionesValidas = ['menos_1', '1_a_2', 'mas_2'];
  return opcionesValidas.includes(valor) ? null : 'Indicá la antigüedad';
}

export function validarNombre(valor) {
  const limpio = String(valor ?? '').trim();
  const soloLetras = limpio.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g, '');
  return soloLetras.length >= 2 ? null : 'Ingresá tu nombre';
}

export function validarApellido(valor) {
  const limpio = String(valor ?? '').trim();
  const soloLetras = limpio.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g, '');
  return soloLetras.length >= 2 ? null : 'Ingresá tu apellido';
}

export function validarDni(valor) {
  const limpio = String(valor ?? '').trim();
  return /^\d{7,8}$/.test(limpio) ? null : 'El DNI debe tener 7 u 8 números';
}

export function validarFechaNacimiento(valor) {
  const limpio = String(valor ?? '').trim();
  if (!limpio) return 'Tenés que ser mayor de edad';

  const partes = limpio.split('-').map(Number);
  if (partes.length !== 3 || partes.some((n) => Number.isNaN(n))) {
    return 'Tenés que ser mayor de edad';
  }

  const [anioNac, mesNac, diaNac] = partes;
  const hoy = new Date();
  let edad = hoy.getFullYear() - anioNac;
  const mesActual = hoy.getMonth() + 1;
  const diaActual = hoy.getDate();

  if (mesActual < mesNac || (mesActual === mesNac && diaActual < diaNac)) {
    edad -= 1;
  }

  return edad >= 18 && edad <= 120 ? null : 'Tenés que ser mayor de edad';
}

export function validarEmail(valor) {
  const limpio = String(valor ?? '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)
    ? null
    : 'Ingresá un email válido';
}

export function validarCelular(valor) {
  const limpio = String(valor ?? '').replace(/[\s-]/g, '');
  const esValido =
    /^\d{10}$/.test(limpio) &&
    !limpio.startsWith('0') &&
    !limpio.startsWith('15') &&
    !/^(11|[23]\d{1,3})15/.test(limpio);

  return esValido ? null : 'Ej.: 11 5555-1234';
}

export function validarTerminos(valor) {
  return valor === true ? null : 'Tenés que aceptar los términos';
}

export function validarTarjeta(valor) {
  const limpio = String(valor ?? '').replace(/\s+/g, '');
  return /^\d{16}$/.test(limpio) ? null : 'Número de tarjeta inválido';
}

export function validarVencimiento(valor) {
  const limpio = String(valor ?? '').trim();
  const match = /^(\d{2})\/(\d{2})$/.exec(limpio);
  if (!match) return 'Vencimiento inválido';

  const mes = Number(match[1]);
  const anioCorto = Number(match[2]);
  if (mes < 1 || mes > 12) return 'Vencimiento inválido';

  const hoy = new Date();
  const anioActual = hoy.getFullYear() % 100;
  const mesActual = hoy.getMonth() + 1;

  const esFuturo =
    anioCorto > anioActual || (anioCorto === anioActual && mes > mesActual);

  return esFuturo ? null : 'Vencimiento inválido';
}

export function validarCvv(valor) {
  const limpio = String(valor ?? '').trim();
  return /^\d{3}$/.test(limpio) ? null : 'CVV inválido';
}

export function validarTitularTarjeta(valor) {
  const limpio = String(valor ?? '').trim();
  return limpio.length >= 2 ? null : 'Ingresá el nombre del titular';
}

// ==========================================
// VALIDACIÓN INTEGRAL POR PASO
// ==========================================

export function obtenerErroresPaso1(equipo = solicitud.equipo) {
  return {
    marca: validarMarca(equipo.marca),
    modelo: validarModelo(equipo.modelo),
    valorEquipo: validarValorEquipo(equipo.valor),
    antiguedad: validarAntiguedad(equipo.antiguedad),
  };
}

export function validarPaso1(equipo = solicitud.equipo) {
  const errores = obtenerErroresPaso1(equipo);
  return Object.values(errores).every((error) => error === null);
}

export function obtenerErroresPaso3(titular = solicitud.titular) {
  return {
    nombre: validarNombre(titular.nombre),
    apellido: validarApellido(titular.apellido),
    dni: validarDni(titular.dni),
    fechaNacimiento: validarFechaNacimiento(titular.nacimiento),
    email: validarEmail(titular.email),
    celular: validarCelular(titular.celular),
    aceptaTerminos: validarTerminos(titular.terminos),
  };
}

export function validarPaso3(titular = solicitud.titular) {
  const errores = obtenerErroresPaso3(titular);
  return Object.values(errores).every((error) => error === null);
}

export function obtenerErroresPaso4(pago = solicitud.pago) {
  return {
    numeroTarjeta: validarTarjeta(pago.tarjeta),
    vencimiento: validarVencimiento(pago.vencimiento),
    cvv: validarCvv(pago.cvv),
    titularTarjeta: validarTitularTarjeta(pago.titular),
  };
}

export function validarPaso4(pago = solicitud.pago) {
  const errores = obtenerErroresPaso4(pago);
  return Object.values(errores).every((error) => error === null);
}
