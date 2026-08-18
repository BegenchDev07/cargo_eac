export interface Freight {
  id?: string;
  freight_number: string;
  load_date: string;
  notes?: string;
  status?: 'open' | 'closed' | 'shipped';
  created_at?: string;
}

export type CreateFreightInput = Omit<Freight, 'id' | 'freight_number' | 'created_at'>;
