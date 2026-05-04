export interface InvoiceItem {
  description: string;
  qty: number | null;
  rate: number | null;
  amount: number;
}

export interface InvoiceData {
  invoiceNo: string;
  invoiceDate: string;
  vehicleNo: string;
  toName: string;
  toAddress: string;
  toGSTIN: string;
  fromAddress: string;
  companyGST: string;
  items: InvoiceItem[];
  weight: string;
  loadingDate: string;
  hamaliHalt: number | null;
  gstType: 'cgst_sgst' | 'igst';
}
