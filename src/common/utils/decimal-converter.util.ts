import { Prisma } from '@prisma/client';

export function convertDecimalsToNumbers(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'object') {
    // Si es un objeto Decimal de Prisma
    if (obj instanceof Prisma.Decimal || (obj.constructor && obj.constructor.name === 'Decimal')) {
      return obj.toNumber();
    }
    
    // Si es un array, procesar cada elemento
    if (Array.isArray(obj)) {
      return obj.map(item => convertDecimalsToNumbers(item));
    }
    
    // Si es un objeto regular, procesar cada propiedad
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = convertDecimalsToNumbers(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}