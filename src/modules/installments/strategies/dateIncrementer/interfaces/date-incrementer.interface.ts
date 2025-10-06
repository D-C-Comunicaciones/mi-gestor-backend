export interface DateIncrementer {
  supports(frequencyName: string): boolean;
  increment(date: Date): Date;
}