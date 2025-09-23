export interface CustomerWithDetails {
  id: number;
  firstName: string;
  lastName: string;
  typeDocumentIdentificationId: number;
  typeDocumentIdentificationName: string | null;
  documentNumber: number;
  genderId: number;
  genderName: string | null;
  birthDate: string | null;
  address: string;
  phone: string;
  zoneId: number;
  zoneName: string | null;
  zoneCode: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  loans?: {
    id: number;
    customerId: number;
    loanAmount: number;
    remainingBalance: number;
    interestRateId: number;
    interestRateValue: number;
    paymentAmount: number;
    termId: number;
    termValue: number;
    paymentFrequencyId: number;
    paymentFrequencyName: string;
    loanTypeId: number;
    loanTypeName: string;
    loanStatusId: number;
    loanStatusName: string;
    startDate: string;
    nextDueDate?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[];
  createdAt: Date | null;
  updatedAt: Date | null;
}
