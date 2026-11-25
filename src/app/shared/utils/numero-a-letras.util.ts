export function numeroALetrasSoles(monto: number): string {
  if (!monto || isNaN(monto)) return 'CERO Y 00/100 SOLES';
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const especiales: Record<number, string> = {
    10: 'DIEZ', 11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
    16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE',
    20: 'VEINTE', 21: 'VEINTIUNO', 22: 'VEINTIDÓS', 23: 'VEINTITRÉS', 24: 'VEINTICUATRO',
    25: 'VEINTICINCO', 26: 'VEINTISÉIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE'
  };
  const decenas = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  const num = Math.floor(monto);
  const centavos = Math.round((monto - num) * 100);
  const strCentavos = centavos.toString().padStart(2, '0');

  if (num === 0) return `CERO Y ${strCentavos}/100 SOLES`;
  if (num === 100) return `CIEN Y ${strCentavos}/100 SOLES`;

  function convertirCentena(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'CIEN ';
    let out = '';
    const c = Math.floor(n / 100);
    const restC = n % 100;

    if (c > 0) out += centenas[c] + ' ';
    if (restC === 0) return out;

    if (especiales[restC]) {
      out += especiales[restC] + ' ';
    } else {
      const d = Math.floor(restC / 10);
      const u = restC % 10;
      if (d > 0) out += decenas[d] + (u > 0 ? ' Y ' : ' ');
      if (u > 0) out += unidades[u] + ' ';
    }
    return out;
  }

  let texto = '';
  if (num >= 1000) {
    const miles = Math.floor(num / 1000);
    const resto = num % 1000;
    texto += (miles === 1 ? 'MIL ' : convertirCentena(miles) + 'MIL ');
    if (resto > 0) texto += convertirCentena(resto);
  } else {
    texto += convertirCentena(num);
  }

  return `${texto.trim()} Y ${strCentavos}/100 SOLES`;
}
