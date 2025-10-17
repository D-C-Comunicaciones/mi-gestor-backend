export interface ReportHandler<TParams = any, TResult = any> {
  getName(): string;
  execute(params?: TParams): Promise<TResult>;
}