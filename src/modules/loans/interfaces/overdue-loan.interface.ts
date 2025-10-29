export interface OverdueLoan {
  loanId: number;
  loanAmount: string;
  remainingBalance: string;
  loanTypeName: string;
  loanStatusName: string;
  startDate: string;
  customer: {
    id: number;
    name: string;
    documentNumber: string;
    phone: string;
    address: string;
    zoneName: string;
    zoneCode: string;
  };
  installments: {
    installmentId: number;
    sequence: number;
    dueDate: string;
    capitalAmount: string;
    interestAmount: string;
    totalAmount: string;
    paidAmount: string;
    isPaid: boolean;
    moratoryAmount: string;
    daysLate: number;
  }[];
  totalMoratoryAmount: string;
  totalDaysLate: number;
  totalAmountOwed: string;
}
