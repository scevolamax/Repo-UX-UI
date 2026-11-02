let contador =
  typeof localStorage !== 'undefined'
    ? Number(localStorage.getItem('cubri_seguros_contador_poliza') || 0)
    : 0;

export function simularPago(numero) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const limpio = numero.replace(/\s/g, '');
      resolve(
        limpio === '4000000000000002'
          ? { ok: false, motivo: 'Tarjeta rechazada' }
          : { ok: true }
      );
    }, 1500);
  });
}

export function generarPoliza() {
  contador += 1;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cubri_seguros_contador_poliza', String(contador));
    }
  } catch {
    // Continuar con el contador en memoria si localStorage no está disponible
  }
  return `POL-${new Date().getFullYear()}-${String(contador).padStart(6, '0')}`;
}
