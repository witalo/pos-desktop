// src/utils/numberToWords.ts

/**
 * Convierte un número a su representación en letras (Soles Peruanos)
 * Soporta números desde 0.01 hasta 999,999,999.99
 */
export const numeroALetras = (num: number): string => {
  // Validar entrada
  if (isNaN(num) || num < 0) {
    return 'CERO CON 00/100 SOLES';
  }

  // Arrays de conversión
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  // Función auxiliar para convertir grupos de 3 dígitos
  const convertirGrupo = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';
    
    let resultado = '';
    
    // Centenas
    const c = Math.floor(n / 100);
    if (c > 0) {
      resultado += centenas[c];
      n %= 100;
      if (n > 0) resultado += ' ';
    }

    // Decenas y unidades
    if (n >= 10 && n <= 19) {
      resultado += especiales[n - 10];
    } else {
      const d = Math.floor(n / 10);
      const u = n % 10;
      
      if (d > 0) {
        if (d === 2 && u > 0) {
          resultado += 'VEINTI' + unidades[u];
        } else {
          resultado += decenas[d];
          if (u > 0) resultado += ' Y ' + unidades[u];
        }
      } else if (u > 0) {
        resultado += unidades[u];
      }
    }

    return resultado;
  };

  // Separar parte entera y decimal
  const parteEntera = Math.floor(num);
  const parteDecimal = Math.round((num - parteEntera) * 100);

  // Caso especial: números menores a 1
  if (parteEntera === 0 && parteDecimal > 0) {
    return `CERO CON ${parteDecimal.toString().padStart(2, '0')}/100 SOLES`;
  }

  // Caso especial: cero
  if (parteEntera === 0 && parteDecimal === 0) {
    return 'CERO CON 00/100 SOLES';
  }

  let letras = '';

  // Millones
  const millones = Math.floor(parteEntera / 1000000);
  if (millones > 0) {
    if (millones === 1) {
      letras += 'UN MILLÓN';
    } else {
      letras += convertirGrupo(millones) + ' MILLONES';
    }
    if (parteEntera % 1000000 > 0) letras += ' ';
  }

  // Miles
  const miles = Math.floor((parteEntera % 1000000) / 1000);
  if (miles > 0) {
    if (miles === 1) {
      letras += 'MIL';
    } else {
      letras += convertirGrupo(miles) + ' MIL';
    }
    if (parteEntera % 1000 > 0) letras += ' ';
  }

  // Unidades
  const unidadesNum = parteEntera % 1000;
  if (unidadesNum > 0) {
    letras += convertirGrupo(unidadesNum);
  }

  // Agregar decimales y moneda
  letras = letras.trim() + ` CON ${parteDecimal.toString().padStart(2, '0')}/100 SOLES`;

  return letras.trim();
};

// Función auxiliar para formatear moneda
export const formatCurrency = (amount: number): string => {
  return `S/ ${amount.toFixed(2)}`;
};

// Función auxiliar para formatear hora
export const formatTime = (time: string): string => {
  if (!time) return '';
  // Asegurar que solo tomamos HH:MM
  return time.substring(0, 5);
};