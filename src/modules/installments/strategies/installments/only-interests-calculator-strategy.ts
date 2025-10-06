import { Prisma } from "@prisma/client";
import { CreditCalculator } from "./interfaces";
import { DateIncrementerFactory } from "../dateIncrementer/factories";

export class OnlyInterestsCalculatorStrategy implements CreditCalculator {
  constructor(
    private calculateAndCreateInstallment: (
      loan: any,
      installmentNumber: number,
      dueDate: Date,
      gracePeriod: number,
      tx: Prisma.TransactionClient
    ) => Promise<any>,
    private readonly dateIncrementerFactory: DateIncrementerFactory,
  ) {}

  async createFirstInstallment(
    tx: Prisma.TransactionClient,
    loan: any,
    options: { gracePeriod?: number | null }
  ): Promise<{ installment: any; remainingInstallments: number | null }> {
    if (!options.gracePeriod) {
      throw new Error("GracePeriod requerido para crédito only_interests");
    }

    const incrementer = this.dateIncrementerFactory.getIncrementer(loan.paymentFrequency.name);
    const firstDueDate = incrementer(new Date(loan.startDate));

    const installment = await this.calculateAndCreateInstallment(
      loan,
      1,
      firstDueDate,
      options.gracePeriod,
      tx
    );

    return { installment, remainingInstallments: null };
  }
}
