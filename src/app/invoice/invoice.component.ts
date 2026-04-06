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
  allCustomerNames: string[] = [];
  customerProfiles: { name: string; gstin: string }[] = [];
  nameSuggestions: string[] = [];
  showSuggestions = false;

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
    const today = new Date();
    this.invoice.invoiceDate = today.toISOString().split('T')[0];
    this.firebaseService.getCustomerProfiles()
      .then(profiles => {
        this.customerProfiles = profiles;
        this.allCustomerNames = profiles.map(p => p.name);
      })
      .catch(() => {});
  }

  onNameInput(): void {
    const val = (this.invoice.toName || '').toLowerCase().trim();
    if (!val) { this.nameSuggestions = []; this.showSuggestions = false; return; }
    this.nameSuggestions = this.allCustomerNames.filter(n => n.toLowerCase().includes(val));
    this.showSuggestions = this.nameSuggestions.length > 0;
  }

  selectName(name: string): void {
    this.invoice.toName = name;
    const profile = this.customerProfiles.find(p => p.name === name);
    if (profile?.gstin) this.invoice.toGSTIN = profile.gstin;
    this.showSuggestions = false;
  }

  hideSuggestions(): void {
    setTimeout(() => this.showSuggestions = false, 150);
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

  previewPDF(): void {
    this.pdfService.previewInvoice(this.invoice);
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
