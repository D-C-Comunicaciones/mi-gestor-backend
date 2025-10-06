import { Prisma } from "@prisma/client";
import { CreditCalculator } from "./interfaces";
import { DateIncrementerFactory } from "../dateIncrementer/factories";

export class FixedFeesCalculatorStrategy implements CreditCalculator {
  constructor(
    private calculateAndCreateInstallment: (
      loan: any,
      installmentNumber: number,
      dueDate: Date,
      termValue: number,
      tx: Prisma.TransactionClient
    ) => Promise<any>,
    private readonly dateIncrementerFactory: DateIncrementerFactory,
  ) { }

  async createFirstInstallment(
    tx: Prisma.TransactionClient,
    loan: any,
    options: { termValue?: number | null }
  ): Promise<{ installment: any; remainingInstallments: number | null }> {
    if (!options.termValue) {
      throw new Error("TermValue requerido para crédito fixed_fees");
    }

    const incrementer = this.dateIncrementerFactory.getIncrementer(loan.paymentFrequency.name);
    const firstDueDate = incrementer(new Date(loan.startDate));

    const remainingInstallments = options.termValue - 1;

    const installment = await this.calculateAndCreateInstallment(
      loan,
      1,
      firstDueDate,
      options.termValue,
      tx
    );

    return { installment, remainingInstallments };
  }

}
