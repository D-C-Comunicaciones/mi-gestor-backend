import { Injectable, BadRequestException } from '@nestjs/common';
import { FixedFeesStrategy } from '../fixed-fees-strategy';
import { OnlyInterestsStrategy } from '../only-interests-strategy';
import { LoanStrategy } from '../interfaces';

@Injectable()
export class LoanStrategyFactory {
  constructor(
    private readonly fixedFeesStrategy: FixedFeesStrategy,
    private readonly onlyInterestsStrategy: OnlyInterestsStrategy,
  ) {}

  getStrategy(loanTypeName: string): LoanStrategy {
    const strategies = {
      'fixed_fees': this.fixedFeesStrategy,
      'only_interests': this.onlyInterestsStrategy,
    };

    const strategy = strategies[loanTypeName];
    if (!strategy) {
      throw new BadRequestException(`Tipo de crédito no soportado: ${loanTypeName}`);
    }

    return strategy;
  }

  /**
   * Obtiene todos los tipos de crédito disponibles
   */
  getAvailableLoanTypes(): string[] {
    return ['fixed_fees', 'only_interests'];
  }
}
