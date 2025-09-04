export class AllocationResponseDto {
  installmentId: number;
  appliedToCapital: number;
  appliedToInterest: number;
  appliedToLateFee: number;
}

export class CollectionResponseDto {
  success: boolean;
  message: string;
  paymentId: number;
  loanId: number;
  appliedToCapital: number;
  appliedToInterest: number;
  appliedToLateFee: number;
  excessAmount?: number;
  newRemainingBalance: number;
  allocations: AllocationResponseDto[];
}
