import { FixedFeesCalculatorStrategy } from "../fixed-fees-calculator-strategy";
import { CreditCalculator } from "../interfaces";
import { OnlyInterestsCalculatorStrategy } from "../only-interests-calculator-strategy";

export class CreditCalculatorFactory {
  constructor(
    private calculateAndCreateInstallment: any,
    private dateIncrementerFactory: any,
  ) {}

  getCalculator(type: string): CreditCalculator {
    switch (type) {
      case "fixed_fees":
        return new FixedFeesCalculatorStrategy(
          this.calculateAndCreateInstallment,
          this.dateIncrementerFactory,
        );
      case "only_interests":
        return new OnlyInterestsCalculatorStrategy(
          this.calculateAndCreateInstallment,
          this.dateIncrementerFactory,
        );
      default:
        throw new Error(`Tipo de crédito no soportado: ${type}`);
    }
  }
}
