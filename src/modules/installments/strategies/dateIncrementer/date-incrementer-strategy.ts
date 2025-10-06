import { addDays, addWeeks, addMonths, addSeconds } from "date-fns";
import { DateIncrementer } from "./interfaces";

export class DailyIncrementer implements DateIncrementer {
  supports(frequencyName: string): boolean {
    return frequencyName.toUpperCase().includes("DAILY");
  }
  increment(date: Date): Date {
    return addDays(date, 1);
  }
}

export class WeeklyIncrementer implements DateIncrementer {
  supports(frequencyName: string): boolean {
    return frequencyName.toUpperCase().includes("WEEKLY");
  }
  increment(date: Date): Date {
    return addWeeks(date, 1);
  }
}

export class BiweeklyIncrementer implements DateIncrementer {
  supports(frequencyName: string): boolean {
    return frequencyName.toUpperCase().includes("BIWEEKLY");
  }
  increment(date: Date): Date {
    return addDays(date, 15);
  }
}

export class MonthlyIncrementer implements DateIncrementer {
  supports(frequencyName: string): boolean {
    return frequencyName.toUpperCase().includes("MONTHLY");
  }
  increment(date: Date): Date {
    return addMonths(date, 1);
  }
}

export class MinuteIncrementer implements DateIncrementer {
  supports(frequencyName: string): boolean {
    return frequencyName.toUpperCase().includes("MINUTE");
  }
  increment(date: Date): Date {
    return addSeconds(date, 60);
  }
}
