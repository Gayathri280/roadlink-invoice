import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FirebaseService, SavedInvoice } from '../firebase/firebase.service';
import { PdfService } from '../invoice/pdf.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
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
        <h2>Invoice History</h2>

        <div *ngIf="loading" class="state-msg">Loading...</div>
        <div *ngIf="!loading && invoices.length === 0" class="state-msg">No invoices saved yet.</div>

        <table *ngIf="!loading && invoices.length > 0" class="inv-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Invoice No.</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Grand Total</th>
              <th>Saved At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let inv of invoices; let i = index">
              <td>{{ i + 1 }}</td>
              <td>{{ inv.invoiceNo || '—' }}</td>
              <td>{{ inv.invoiceDate || '—' }}</td>
              <td>{{ inv.toName || '—' }}</td>
              <td>₹ {{ inv.grandTotal | number:'1.2-2' }}</td>
              <td>{{ inv.savedAt | date:'dd/MM/yyyy, h:mm a' }}</td>
              <td class="actions">
                <button class="btn-download" (click)="redownload(inv)">Download PDF</button>
                <button class="btn-delete" (click)="delete(inv)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
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
    h2 { margin-bottom: 20px; color: #1a237e; font-size: 20px; }

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
  `]
})
export class HistoryComponent implements OnInit {
  invoices: SavedInvoice[] = [];
  loading = true;

  constructor(
    private firebaseService: FirebaseService,
    private pdfService: PdfService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.firebaseService.getInvoices().subscribe({
      next: (data) => { this.invoices = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  goToInvoice(): void {
    this.router.navigate(['/invoice']);
  }

  redownload(inv: SavedInvoice): void {
    this.pdfService.generateInvoice(inv.data);
  }

  delete(inv: SavedInvoice): void {
    if (!inv.id) return;
    if (confirm(`Delete invoice ${inv.invoiceNo}?`)) {
      this.firebaseService.deleteInvoice(inv.id);
    }
  }
}
