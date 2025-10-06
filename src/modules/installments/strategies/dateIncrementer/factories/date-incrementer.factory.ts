import { DateIncrementer } from "../interfaces";

export class DateIncrementerFactory {
  constructor(private readonly strategies: DateIncrementer[]) {}

  getIncrementer(frequencyName: string): (date: Date) => Date {
    const freq = frequencyName.toUpperCase();

    const strategy = this.strategies.find((s) => s.supports(freq));
    if (!strategy) {
      // fallback → mensual
      return (date: Date) => {
        const copy = new Date(date);
        copy.setMonth(copy.getMonth() + 1);
        return copy;
      };
    }

    return (date: Date) => strategy.increment(date);
  }
}
