import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService, SavedInvoice } from '../firebase/firebase.service';
import { PdfService } from '../invoice/pdf.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="history-container">
      <div class="history-header">
        <div class="header-left">
          <img src="assets/logo.png" alt="Roadlink Cargos" class="header-logo" />
        </div>
        <div class="header-actions">
          <button class="btn-new" (click)="goToInvoice()">+ New Invoice</button>
        </div>
      </div>

      <div class="history-body">
        <div class="history-title-row">
          <h2>Invoice History</h2>
          <input class="search-input" type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" placeholder="Search by invoice no, customer or vehicle..." />
        </div>

        <div *ngIf="loading" class="state-msg">Loading...</div>
        <div *ngIf="!loading && filteredInvoices.length === 0" class="state-msg">No invoices found.</div>

        <table *ngIf="!loading && filteredInvoices.length > 0" class="inv-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Invoice No.</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Vehicle No.</th>
              <th>Grand Total</th>
              <th>Saved At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let inv of pagedInvoices; let i = index">
              <td>{{ (currentPage - 1) * pageSize + i + 1 }}</td>
              <td>{{ inv.invoiceNo || '—' }}</td>
              <td>{{ inv.invoiceDate || '—' }}</td>
              <td>{{ inv.toName || '—' }}</td>
              <td>{{ inv.vehicleNo || inv.data?.vehicleNo || '—' }}</td>
              <td>₹ {{ inv.grandTotal | number:'1.2-2' }}</td>
              <td>{{ inv.savedAt | date:'dd/MM/yyyy, h:mm a' }}</td>
              <td class="actions">
                <button class="btn-preview" (click)="preview(inv)" title="Preview PDF">👁</button>
                <button class="btn-download" (click)="redownload(inv)">Download PDF</button>
                <button class="btn-delete" (click)="delete(inv)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="!loading && totalPages > 1" class="pagination">
          <button class="pg-btn" [disabled]="currentPage === 1" (click)="goToPage(1)">«</button>
          <button class="pg-btn" [disabled]="currentPage === 1" (click)="goToPage(currentPage - 1)">‹</button>
          <button *ngFor="let p of pageNumbers" class="pg-btn" [class.active]="p === currentPage" (click)="goToPage(p)">{{ p }}</button>
          <button class="pg-btn" [disabled]="currentPage === totalPages" (click)="goToPage(currentPage + 1)">›</button>
          <button class="pg-btn" [disabled]="currentPage === totalPages" (click)="goToPage(totalPages)">»</button>
          <span class="pg-info">Page {{ currentPage }} of {{ totalPages }} ({{ filteredInvoices.length }} records)</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-container { min-height: 100vh; background: #f0f2f5; }

    .history-header {
      background: #1a237e;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-logo { height: 36px; }
    .btn-new {
      background: #F0A500; color: #fff; border: none;
      padding: 8px 18px; border-radius: 6px; font-size: 14px;
      font-weight: 600; cursor: pointer;
    }
    .btn-new:hover { background: #d4920a; }

    .history-body { padding: 24px; }
    .history-title-row {
      display: flex; align-items: center;
      justify-content: space-between; margin-bottom: 20px;
    }
    h2 { margin: 0; color: #1a237e; font-size: 20px; }
    .search-input {
      padding: 8px 14px; border: 1px solid #ccc;
      border-radius: 6px; font-size: 14px; width: 260px;
      outline: none;
    }
    .search-input:focus { border-color: #1a237e; }

    .state-msg { color: #888; font-size: 15px; text-align: center; margin-top: 40px; }

    .inv-table {
      width: 100%; border-collapse: collapse;
      background: #fff; border-radius: 8px;
      overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    .inv-table th {
      background: #1a237e; color: #fff;
      padding: 12px 14px; text-align: left; font-size: 13px;
    }
    .inv-table td {
      padding: 11px 14px; font-size: 13px;
      border-bottom: 1px solid #f0f0f0; color: #333;
    }
    .inv-table tr:last-child td { border-bottom: none; }
    .inv-table tr:hover td { background: #f5f7ff; }

    .actions { display: flex; gap: 8px; }
    .btn-preview {
      background: #388e3c; color: #fff; border: none;
      padding: 5px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;
    }
    .btn-preview:hover { background: #2e7d32; }
    .btn-download {
      background: #1a237e; color: #fff; border: none;
      padding: 5px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;
    }
    .btn-download:hover { background: #283593; }
    .btn-delete {
      background: #e53935; color: #fff; border: none;
      padding: 5px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;
    }
    .btn-delete:hover { background: #c62828; }

    .pagination {
      display: flex; align-items: center; gap: 4px;
      margin-top: 16px; justify-content: center; flex-wrap: wrap;
    }
    .pg-btn {
      background: #fff; border: 1px solid #ccc; color: #1a237e;
      padding: 6px 11px; border-radius: 4px; font-size: 13px;
      cursor: pointer; min-width: 34px;
    }
    .pg-btn:hover:not([disabled]) { background: #e8eaf6; }
    .pg-btn[disabled] { color: #bbb; cursor: default; }
    .pg-btn.active { background: #1a237e; color: #fff; border-color: #1a237e; font-weight: 700; }
    .pg-info { margin-left: 10px; font-size: 13px; color: #666; }
  `]
})
export class HistoryComponent implements OnInit {
  invoices: SavedInvoice[] = [];
  loading = true;
  searchQuery = '';
  currentPage = 1;
  readonly pageSize = 10;

  get filteredInvoices(): SavedInvoice[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.invoices;
    return this.invoices.filter(inv =>
      (inv.invoiceNo || '').toLowerCase().includes(q) ||
      (inv.toName || '').toLowerCase().includes(q) ||
      (inv.vehicleNo || inv.data?.vehicleNo || '').toLowerCase().includes(q)
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredInvoices.length / this.pageSize) || 1;
  }

  get pagedInvoices(): SavedInvoice[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredInvoices.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    const delta = 2;
    const range: number[] = [];
    for (let p = Math.max(1, cur - delta); p <= Math.min(total, cur + delta); p++) {
      range.push(p);
    }
    return range;
  }

  goToPage(page: number): void {
    this.currentPage = Math.max(1, Math.min(page, this.totalPages));
  }

  onSearch(): void {
    this.currentPage = 1;
  }

  constructor(
    private firebaseService: FirebaseService,
    private pdfService: PdfService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.firebaseService.getInvoices().subscribe({
      next: (data) => { console.log('Invoices loaded:', data); this.invoices = data; this.loading = false; },
      error: (err) => { console.error('Error loading invoices:', err); this.loading = false; }
    });
  }

  goToInvoice(): void {
    this.router.navigate(['/invoice']);
  }

  redownload(inv: SavedInvoice): void {
    this.pdfService.generateInvoice(inv.data);
  }

  preview(inv: SavedInvoice): void {
    this.pdfService.previewInvoice(inv.data);
  }

  delete(inv: SavedInvoice): void {
    if (!inv.id) return;
    if (confirm(`Delete invoice ${inv.invoiceNo}?`)) {
      this.firebaseService.deleteInvoice(inv.id);
    }
  }
}
