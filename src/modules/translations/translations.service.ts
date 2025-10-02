import { Injectable } from '@nestjs/common';

@Injectable()
export class TranslationService {
  private readonly translations = {
    paymentFrequency: {
      'Minute': 'Minuto',
      'Weekly': 'Semanal',
      'Biweekly': 'Quincenal',
      'Monthly': 'Mensual',
      'Daily': 'Diario',
    },
    loanStatus: {
      'Up to Date': 'Al día',
      'Overdue': 'En Mora',
      'Paid': 'Pagado',
      'Cancelled': 'Cancelado',
      'Refinanced': 'Refinanciado',
      'Outstanding Balance': 'Saldo Pendiente',
    },
    installmentStatus: {
      'Pending': 'Pendiente',
      'Paid': 'Pagado',
      'Overdue Paid': 'En Mora',
      'Partial': 'Parcial',
      'Partial Paid': 'Parcial Pagado',
      'Late': 'Tardío',
      'Late Paid': 'Tardío Pagado',
    },
    loanTypes: {
      'fixed_fees': 'Cuotas Fijas',
      'only_interests': 'Interés Mensual',
    },
  };

  translate(type: keyof typeof this.translations, key: string): string {
    return this.translations[type][key] || key;
  }

  // Atajos más expresivos
  translateLoanType(key: string): string {
    return this.translate('loanTypes', key);
  }

  translatePaymentFrequency(key: string): string {
    return this.translate('paymentFrequency', key);
  }

  translateLoanStatus(key: string): string {
    return this.translate('loanStatus', key);
  }

  translateInstallmentStatus(key: string): string {
    return this.translate('installmentStatus', key);
  }

  // Método auxiliar para traducir estados de intereses moratorios
  translateMoratoryStatus(statusName: string): string {
    const translations = {
      'Unpaid': 'No Pagado',
      'Paid': 'Pagado',
      'Partially Paid': 'Parcialmente Pagado',
      'Cancelled': 'Cancelado',
      'Forgiven': 'Condonado'
    };
    return translations[statusName] || statusName;
  }
}