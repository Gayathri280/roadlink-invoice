import { Injectable } from '@angular/core';
import {
  Firestore, collection, addDoc, collectionData, orderBy, query, deleteDoc, doc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { InvoiceData } from '../invoice/invoice.model';

export interface SavedInvoice {
  id?: string;
  savedAt: number;
  invoiceNo: string;
  toName: string;
  invoiceDate: string;
  grandTotal: number;
  data: InvoiceData;
}

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  constructor(private firestore: Firestore) {}

  saveInvoice(invoiceData: InvoiceData, grandTotal: number): Promise<void> {
    const ref = collection(this.firestore, 'invoices');
    const record: Omit<SavedInvoice, 'id'> = {
      savedAt: Date.now(),
      invoiceNo: invoiceData.invoiceNo || 'draft',
      toName: invoiceData.toName || '',
      invoiceDate: invoiceData.invoiceDate || '',
      grandTotal,
      data: invoiceData
    };
    return addDoc(ref, record).then(() => {});
  }

  getInvoices(): Observable<SavedInvoice[]> {
    const ref = collection(this.firestore, 'invoices');
    const q = query(ref, orderBy('savedAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<SavedInvoice[]>;
  }

  deleteInvoice(id: string): Promise<void> {
    const ref = doc(this.firestore, 'invoices', id);
    return deleteDoc(ref);
  }
}
