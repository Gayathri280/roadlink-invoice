import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { PdfService } from './pdf.service';
import { InvoiceData, InvoiceItem } from './invoice.model';
import { FirebaseService } from '../firebase/firebase.service';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice.component.html'
})
export class InvoiceComponent implements OnInit {
  invoice: InvoiceData = this.emptyInvoice();

  get subtotal(): number {
    return this.invoice.items.reduce(
      (s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0),
      0
    );
  }

  get hamali(): number {
    return Number(this.invoice.hamaliHalt) || 0;
  }

  get taxableAmount(): number {
    return this.subtotal + this.hamali;
  }

  get csgt(): number {
    return this.invoice.gstType === 'cgst_sgst' ? this.taxableAmount * 0.09 : 0;
  }

  get sgst(): number {
    return this.invoice.gstType === 'cgst_sgst' ? this.taxableAmount * 0.09 : 0;
  }

  get igst(): number {
    return this.invoice.gstType === 'igst' ? this.taxableAmount * 0.18 : 0;
  }

  get grandTotal(): number {
    return this.taxableAmount + this.csgt + this.sgst + this.igst;
  }

  constructor(
    private authService: AuthService,
    private pdfService: PdfService,
    private router: Router,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    // Set today's date as default
    const today = new Date();
    this.invoice.invoiceDate = today.toISOString().split('T')[0];
  }

  itemAmount(item: InvoiceItem): number {
    return (Number(item.qty) || 0) * (Number(item.rate) || 0);
  }

  addRow(): void {
    this.invoice.items.push({ description: '', qty: null, rate: null, amount: 0 });
  }

  removeRow(index: number): void {
    if (this.invoice.items.length > 1) {
      this.invoice.items.splice(index, 1);
    }
  }

  generatePDF(): void {
    this.pdfService.generateInvoice(this.invoice);
    this.firebaseService.saveInvoice(this.invoice, this.grandTotal)
      .catch(err => console.error('Failed to save invoice:', err));
  }

  resetForm(): void {
    this.invoice = this.emptyInvoice();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToHistory(): void {
    this.router.navigate(['/history']);
  }

  private emptyInvoice(): InvoiceData {
    return {
      invoiceNo: '',
      invoiceDate: '',
      vehicleNo: '',
      toName: '',
      toAddress: '',
      toGSTIN: '',
      fromAddress: '6, Viswasapuram, Saravanampatti post, Coimbatore -641035',
      companyGST: '33BEEPN3956H1ZF',
      items: [
        { description: '', qty: null, rate: null, amount: 0 }
      ],
      hamaliHalt: null,
      gstType: 'igst'
    };
  }
}
