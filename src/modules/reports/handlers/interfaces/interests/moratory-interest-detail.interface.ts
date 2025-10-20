export interface MoratoryInterestDetail {
  id: number;
  status: 'paid' | 'partially paid' | 'unpaid' | 'Discounted' | 'Partially Discounted';
  date: string; // ISO string
  total_generated: number;
  total_collected: number;
  total_pending: number;
  total_discounted: number;
  total_partially_discounted: number;
  collected_percentage: number;
  pending_percentage: number;
}