/* Swagger barrel Decorators  */

// Changes decorators
export * from './changes/find-all-changes-doc.decorator';

// Collections decorators
export * from './collections/create-collection-doc.decorator';
export * from './collections/find-all-collections-doc.decorator';

// Collectors decorators
export * from './collectors/create-collector-doc.decorator';
export * from './collectors/find-all-collectors-doc.decorator';
export * from './collectors/find-one-collector-doc.decorator';
export * from './collectors/find-unassigned-collectors-doc.decorator';
export * from './collectors/update-collector-doc.decorator';

// Discounts decorators
export * from './discounts/create-discount-doc.decorator';
export * from './discounts/find-all-discounts-doc.decorator';

// Loans decorators
export * from './loans/create-loan-doc.decorator';
export * from './loans/find-all-loans-doc.decorator';
export * from './loans/find-one-loan-doc.decorator';
export * from './loans/find-loan-by-customer-doc.decorator';
export * from './loans/find-one-loan-doc.decorator';
export * from './loans/find-overdue-loans-doc.decorator';
export * from './loans/refinance-loan-doc.decorator';
export * from './loans/cancel-loan-doc.decorator';

// Customers decorators
export * from './customers/create-customer-doc.decorator';
export * from './customers/create-many-customers-doc.decorator';
export * from './customers/find-all-customers-doc.decorator';
export * from './customers/find-one-customer-doc.decorator';
export * from './customers/update-customer-doc.decorator';

// Companies decorators
export * from './companies/create-company-doc.decorator';
export * from './companies/find-all-companies-doc.decorator';
export * from './companies/find-one-company-doc.decorator';
export * from './companies/update-company-doc.decorator';

// Reports decorators
export * from './reports/collections-report-doc.decorator';
export * from './reports/loans-report-doc.decorator';
export * from './reports/export-reports-doc.decorator';

// Type discounts decorators
export * from './type-discounts/find-all-type-discounts-doc.decorator';

// Auth decorators
export * from './authentication/login-doc.decorator';
export * from './authentication/get-profile-doc.decorator';
export * from './authentication/logout-doc.decorator';

// Amortization decorators
export * from './amortization/calculate-amortization-doc.decorator';

// App decorators
export * from './app/check-status-server-doc.decorator';