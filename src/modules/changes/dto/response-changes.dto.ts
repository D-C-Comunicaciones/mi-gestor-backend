import { Expose, Transform } from 'class-transformer';
import { format } from 'date-fns';

function formatDatesInObject(obj: any) {
  if (!obj) return null;

  const keys = ['createdAt', 'updatedAt', 'timestamp'];

  const copy = { ...obj };
  keys.forEach((key) => {
    if (copy[key]) {
      try {
        copy[key] = format(new Date(copy[key]), 'yyyy-MM-dd HH:mm:ss');
      } catch (_) {}
    }
  });

  return copy;
}

export class ResponseChangeDto {
  @Expose() id: number;
  @Expose() model: string;
  @Expose() action: string;

  @Expose()
  @Transform(({ value }) => formatDatesInObject(value), { toPlainOnly: true })
  before: Record<string, any> | null;

  @Expose()
  @Transform(({ value }) => formatDatesInObject(value), { toPlainOnly: true })
  after: Record<string, any> | null;

  @Expose()
  @Transform(({ value }) => format(new Date(value), 'yyyy-MM-dd HH:mm:ss'), {
    toPlainOnly: true,
  })
  timestamp: Date;

  @Expose() userId: number;
}
