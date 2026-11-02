const FACTORES_ANTIGUEDAD = {
  menos_1: 1.0,
  '1_a_2': 1.1,
  mas_2: 1.25,
};

const formateadorARS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

/**
 * Calcula la cuota mensual según la fórmula obligatoria:
 * cuota = Math.round(valor * (tasaAnual / 12) * factorAntiguedad)
 */
export function calcularCuota(valor, tasaAnual, antiguedad) {
  const montoLimpio =
    typeof valor === 'number'
      ? valor
      : Number(String(valor ?? '').replace(/\D/g, ''));
  const tasa = Number(tasaAnual);
  const factorAntiguedad = FACTORES_ANTIGUEDAD[antiguedad] ?? 1.0;

  if (!montoLimpio || montoLimpio <= 0 || !tasa || tasa <= 0) {
    return 0;
  }

  return Math.round(montoLimpio * (tasa / 12) * factorAntiguedad);
}

/**
 * Formatea un número en pesos argentinos (ARS) sin decimales.
 */
export function formatearMoneda(numero) {
  const valor = Number(numero);
  if (Number.isNaN(valor)) return '$ 0';
  return formateadorARS.format(valor);
}

export function obtenerFactorAntiguedad(antiguedad) {
  return FACTORES_ANTIGUEDAD[antiguedad] ?? 1.0;
}
