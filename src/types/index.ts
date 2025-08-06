
// Client type
export interface Client {
  id: string;
  name: string;
  code: string; // This represents the Patente number
  ice?: string; // Optional ICE number
  address?: string; // Optional address
}

// Product type
export interface GasCylinder {
  type: '12KG' | '6KG' | '3KG';
  totalQuantity: number;
  distributedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  taxRate: number;
}

// Invoice type
export interface Invoice {
  id: string;
  number: string;
  date: string;
  client: Client;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  companyName: 'STE ZAGAZ' | 'SEBAI AMA';
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

export interface Settings {
  secretCode: string;
  companyName: 'STE ZAGAZ' | 'SEBAI AMA';
  minInvoiceAmount: number;
  maxInvoiceAmount: number;
}
