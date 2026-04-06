import { Injectable } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, query, orderBy,
  onSnapshot, deleteDoc, doc, Firestore
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { InvoiceData } from '../invoice/invoice.model';
import { firebaseConfig } from '../../environments/firebase.config';

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
  private db: Firestore;

  constructor() {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  saveInvoice(invoiceData: InvoiceData, grandTotal: number): Promise<void> {
    const ref = collection(this.db, 'invoices');
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
    const ref = collection(this.db, 'invoices');
    const q = query(ref, orderBy('savedAt', 'desc'));
    return new Observable<SavedInvoice[]>(subscriber => {
      const unsubscribe = onSnapshot(q,
        snapshot => {
          const invoices = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SavedInvoice));
          subscriber.next(invoices);
        },
        err => subscriber.error(err)
      );
      return () => unsubscribe();
    });
  }

  deleteInvoice(id: string): Promise<void> {
    const ref = doc(this.db, 'invoices', id);
    return deleteDoc(ref);
  }

  getCustomerProfiles(): Promise<{ name: string; gstin: string; fromAddress: string; toAddress: string }[]> {
    const ref = collection(this.db, 'invoices');
    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(ref,
        snapshot => {
          unsubscribe();
          const seen = new Map<string, { gstin: string; fromAddress: string; toAddress: string }>();
          snapshot.docs.forEach(d => {
            const inv = d.data() as SavedInvoice;
            const name = (inv.toName || '').trim();
            if (name && !seen.has(name)) {
              seen.set(name, {
                gstin: inv.data?.toGSTIN || '',
                fromAddress: inv.data?.fromAddress || '',
                toAddress: inv.data?.toAddress || ''
              });
            }
          });
          resolve(Array.from(seen.entries()).map(([name, v]) => ({ name, ...v })));
        },
        reject
      );
    });
  }
}
