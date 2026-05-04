import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { FirebaseService, SavedInvoice } from '../firebase/firebase.service';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  template: `
    <div class="report-container">
      <!-- Header -->
      <div class="report-header">
        <div class="header-left">
          <img src="assets/logo.png" alt="Roadlink Cargos" class="header-logo" />
        </div>
        <div class="header-actions">
          <button class="btn-nav" (click)="goToInvoice()">+ New Invoice</button>
          <button class="btn-nav" (click)="goToHistory()">Invoice History</button>
        </div>
      </div>

      <!-- Body -->
      <div class="report-body">
        <h2>Reports</h2>

        <!-- Filter Form -->
        <div class="filter-card">
          <div class="filter-row">
            <div class="filter-group">
              <label>From Date</label>
              <input type="date" [(ngModel)]="fromDate" class="form-input" />
            </div>
            <div class="filter-group">
              <label>To Date</label>
              <input type="date" [(ngModel)]="toDate" class="form-input" />
            </div>
            <div class="filter-group" style="position:relative;">
              <label>Customer</label>
              <input type="text" [(ngModel)]="customerFilter" class="form-input" placeholder="e.g. Customer name"
                (input)="onCustomerInput()" (blur)="hideCustomerSuggestions()" autocomplete="off" />
              <ul class="name-suggestions" *ngIf="showCustomerSuggestions">
                <li *ngFor="let s of customerSuggestions" (mousedown)="selectCustomer(s)">{{ s }}</li>
              </ul>
            </div>
          </div>
          <div class="filter-actions">
            <button class="btn-search" (click)="applyFilters()">Search</button>
            <button class="btn-clear" (click)="clearFilters()">Clear</button>
          </div>
        </div>

        <!-- Results -->
        <div *ngIf="loading" class="state-msg">Loading...</div>

        <ng-container *ngIf="!loading">
          <div *ngIf="!searched" class="state-msg">Enter filters above and click Search to view reports.</div>

          <ng-container *ngIf="searched">
            <div *ngIf="results.length === 0" class="state-msg">No reports found for the selected criteria.</div>

            <ng-container *ngIf="results.length > 0">
              <div class="results-header">
                <span class="results-count">{{ results.length }} record(s) found</span>
                <div class="export-actions">
                  <button class="btn-export-pdf" (click)="exportPDF()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    Export as PDF
                  </button>
                  <button class="btn-export-excel" (click)="exportExcel()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
                      <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
                    </svg>
                    Export as Excel
                  </button>
                </div>
              </div>

              <div class="table-wrap">
                <table class="rep-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Invoice No.</th>
                      <th>Invoice Date</th>
                      <th>Loading Date</th>
                      <th>Customer</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Vehicle No.</th>
                      <th>Weight</th>
                      <th>Grand Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let inv of results; let i = index">
                      <td>{{ i + 1 }}</td>
                      <td>{{ inv.invoiceNo || '—' }}</td>
                      <td>{{ inv.invoiceDate || '—' }}</td>
                      <td>{{ inv.data.loadingDate || '—' }}</td>
                      <td>{{ inv.toName || '—' }}</td>
                      <td>{{ inv.data.fromAddress || '—' }}</td>
                      <td>{{ inv.data.toAddress || '—' }}</td>
                      <td>{{ inv.vehicleNo || inv.data.vehicleNo || '—' }}</td>
                      <td>{{ inv.data.weight || '—' }}</td>
                      <td>{{ roundTotal(inv.grandTotal) | number:'1.2-2' }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="9" class="total-label">Total</td>
                      <td class="total-value">{{ grandTotal | number:'1.2-2' }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </ng-container>
          </ng-container>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .report-container { min-height: 100vh; background: #f0f2f5; }

    .report-header {
      background: #1a237e;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-logo { height: 36px; }
    .header-actions { display: flex; gap: 10px; }
    .btn-nav {
      background: #F0A500; color: #fff; border: none;
      padding: 8px 18px; border-radius: 6px; font-size: 14px;
      font-weight: 600; cursor: pointer;
    }
    .btn-nav:hover { background: #d4920a; }

    .report-body { padding: 24px; }
    h2 { margin: 0 0 20px; color: #1a237e; font-size: 20px; }

    /* Filter Card */
    .filter-card {
      background: #fff;
      border-radius: 10px;
      padding: 20px 24px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      margin-bottom: 24px;
    }
    .filter-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      min-width: 180px;
    }
    .filter-group label {
      font-size: 12px;
      font-weight: 600;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .form-input {
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      color: #333;
    }
    .form-input:focus { border-color: #1a237e; }
    .filter-actions {
      display: flex;
      gap: 10px;
      margin-top: 16px;
    }
    .btn-search {
      background: #1a237e; color: #fff; border: none;
      padding: 9px 24px; border-radius: 6px; font-size: 14px;
      font-weight: 600; cursor: pointer;
    }
    .btn-search:hover { background: #283593; }
    .btn-clear {
      background: #fff; color: #1a237e;
      border: 1px solid #1a237e;
      padding: 9px 20px; border-radius: 6px; font-size: 14px;
      font-weight: 600; cursor: pointer;
    }
    .btn-clear:hover { background: #e8eaf6; }

    .state-msg { color: #888; font-size: 15px; text-align: center; margin-top: 40px; }

    /* Results */
    .results-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .results-count { font-size: 14px; color: #555; font-weight: 600; }
    .export-actions { display: flex; gap: 10px; }

    .btn-export-pdf {
      display: flex; align-items: center; gap: 6px;
      background: #c62828; color: #fff; border: none;
      padding: 8px 18px; border-radius: 6px; font-size: 13px;
      font-weight: 600; cursor: pointer;
    }
    .btn-export-pdf:hover { background: #b71c1c; }

    .btn-export-excel {
      display: flex; align-items: center; gap: 6px;
      background: #2e7d32; color: #fff; border: none;
      padding: 8px 18px; border-radius: 6px; font-size: 13px;
      font-weight: 600; cursor: pointer;
    }
    .btn-export-excel:hover { background: #1b5e20; }

    .table-wrap {
      overflow-x: auto;
      border-radius: 10px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    .rep-table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
    }
    .rep-table th {
      background: #1a237e; color: #fff;
      padding: 12px 14px; text-align: left; font-size: 12px;
      white-space: nowrap;
    }
    .rep-table td {
      padding: 10px 14px; font-size: 13px;
      border-bottom: 1px solid #f0f0f0; color: #333;
      white-space: nowrap;
    }
    .rep-table tr:last-child td { border-bottom: none; }
    .rep-table tbody tr:hover td { background: #f5f7ff; }
    .rep-table tfoot td {
      background: #e8eaf6;
      font-weight: 700;
      font-size: 13px;
      border-top: 2px solid #1a237e;
    }
    .total-label { text-align: right; color: #1a237e; }
    .total-value { color: #1a237e; }
  `]
})
export class ReportComponent implements OnInit, OnDestroy {
  allInvoices: SavedInvoice[] = [];
  results: SavedInvoice[] = [];
  loading = true;
  searched = false;

  fromDate = '';
  toDate = '';
  customerFilter = '';
  customerSuggestions: string[] = [];
  showCustomerSuggestions = false;
  private allCustomerNames: string[] = [];

  private sub!: Subscription;

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.sub = this.firebaseService.getInvoices().subscribe({
      next: (data) => {
        this.allInvoices = data;
        this.loading = false;
        this.allCustomerNames = [...new Set(data.map(inv => inv.toName || '').filter(n => n.trim()))];
      },
      error: () => { this.loading = false; }
    });
  }

  onCustomerInput(): void {
    const val = (this.customerFilter || '').toLowerCase().trim();
    if (!val) { this.customerSuggestions = []; this.showCustomerSuggestions = false; return; }
    this.customerSuggestions = this.allCustomerNames.filter(n => n.toLowerCase().includes(val));
    this.showCustomerSuggestions = this.customerSuggestions.length > 0;
  }

  selectCustomer(name: string): void {
    this.customerFilter = name;
    this.showCustomerSuggestions = false;
  }

  hideCustomerSuggestions(): void {
    setTimeout(() => this.showCustomerSuggestions = false, 150);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  applyFilters(): void {
    this.searched = true;
    this.results = this.allInvoices.filter(inv => {
      // Date range filter (compare against invoiceDate stored as DD/MM/YYYY or YYYY-MM-DD)
      if (this.fromDate || this.toDate) {
        const invDate = this.parseInvoiceDate(inv.invoiceDate);
        if (invDate) {
          if (this.fromDate && invDate < new Date(this.fromDate)) return false;
          if (this.toDate) {
            const toEnd = new Date(this.toDate);
            toEnd.setHours(23, 59, 59, 999);
            if (invDate > toEnd) return false;
          }
        }
      }
      // Customer filter
      if (this.customerFilter.trim()) {
        const q = this.customerFilter.trim().toLowerCase();
        if (!(inv.toName || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  clearFilters(): void {
    this.fromDate = '';
    this.toDate = '';
    this.customerFilter = '';
    this.results = [];
    this.searched = false;
  }

  get grandTotal(): number {
    return this.results.reduce((sum, inv) => sum + Math.round(inv.grandTotal || 0), 0);
  }

  roundTotal(val: number): number {
    return Math.round(val || 0);
  }

  // ── Export as PDF ────────────────────────────────────────────────────────────
  exportPDF(): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });

    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Roadlink Cargos – Invoice Report', 14, 14);

    // Filter summary
    const parts: string[] = [];
    if (this.fromDate) parts.push(`From Date: ${this.fromDate}`);
    if (this.toDate)   parts.push(`To Date: ${this.toDate}`);
    if (this.customerFilter) parts.push(`Customer: ${this.customerFilter}`);
    if (parts.length) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(parts.join('   |   '), 14, 21);
    }

    const rows = this.results.map((inv, i) => {
      const data = inv.data;
      const subTotal = (data.items || []).reduce(
        (s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0
      );
      const hamali  = Number(data.hamaliHalt) || 0;
      const taxable = subTotal + hamali;
      const gstType = data.gstType || 'igst';
      const cgst    = gstType === 'cgst_sgst' ? Math.round(taxable * 0.09 * 100) / 100 : 0;
      const sgst    = gstType === 'cgst_sgst' ? Math.round(taxable * 0.09 * 100) / 100 : 0;
      const igst    = gstType === 'igst'      ? Math.round(taxable * 0.18 * 100) / 100 : 0;
      const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
      return [
        i + 1,
        inv.invoiceNo || '—',
        inv.invoiceDate || '—',
        inv.toName || '—',
        data.fromAddress || '—',
        data.toAddress || '—',
        inv.vehicleNo || data.vehicleNo || '—',
        data.toGSTIN || '—',
        fmt(Math.round(taxable * 100) / 100),
        fmt(cgst),
        fmt(sgst),
        fmt(igst),
        fmt(this.roundTotal(inv.grandTotal))
      ];
    });

    const totalAmount = this.results.reduce((s, inv) => {
      const sub = (inv.data.items || []).reduce((a, it) => a + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
      return s + Math.round((sub + (Number(inv.data.hamaliHalt) || 0)) * 100) / 100;
    }, 0);
    const totalCGST = this.results.reduce((s, inv) => {
      if ((inv.data.gstType || 'igst') !== 'cgst_sgst') return s;
      const sub = (inv.data.items || []).reduce((a, it) => a + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
      return s + Math.round((sub + (Number(inv.data.hamaliHalt) || 0)) * 0.09 * 100) / 100;
    }, 0);
    const totalSGST = totalCGST;
    const totalIGST = this.results.reduce((s, inv) => {
      if ((inv.data.gstType || 'igst') !== 'igst') return s;
      const sub = (inv.data.items || []).reduce((a, it) => a + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
      return s + Math.round((sub + (Number(inv.data.hamaliHalt) || 0)) * 0.18 * 100) / 100;
    }, 0);
    const fmtT = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    autoTable(doc, {
      startY: 26,
      head: [[
        '#', 'Invoice No.', 'Invoice Date', 'Customer',
        'From', 'To', 'Vehicle No.', 'Customer GSTIN', 'Amount',
        'CGST', 'SGST', 'IGST', 'Grand Total'
      ]],
      body: rows,
      foot: [[
        '', '', '', '', '', '', '', 'Total', fmtT(totalAmount), fmtT(totalCGST), fmtT(totalSGST), fmtT(totalIGST),
        fmtT(this.grandTotal)
      ]],
      headStyles: { fillColor: [26, 35, 126], fontSize: 9, fontStyle: 'bold' },
      footStyles: { fillColor: [232, 234, 246], textColor: [26, 35, 126], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, overflow: 'hidden' },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      columnStyles: {
        0:  { cellWidth: 8 },    // #
        1:  { cellWidth: 28 },   // Invoice No.
        2:  { cellWidth: 26 },   // Invoice Date
        3:  { cellWidth: 40 },   // Customer
        4:  { cellWidth: 36 },   // From
        5:  { cellWidth: 36 },   // To
        6:  { cellWidth: 26 },   // Vehicle No.
        7:  { cellWidth: 36 },   // Customer GSTIN
        8:  { cellWidth: 26 },   // Amount
        9:  { cellWidth: 22 },   // CGST
        10: { cellWidth: 22 },   // SGST
        11: { cellWidth: 22 },   // IGST
        12: { cellWidth: 26 }    // Grand Total
      },
      showFoot: 'lastPage',
      margin: { left: 14, right: 14 }
    });

    const dateStr = this.datePipe.transform(new Date(), 'yyyyMMdd') || 'report';
    doc.save(`Roadlink_Report_${dateStr}.pdf`);
  }

  // ── Export as Excel ──────────────────────────────────────────────────────────
  exportExcel(): void {
    const headers = [
      '#', 'Invoice No.', 'Invoice Date', 'Customer',
      'Vehicle No.', 'Customer GSTIN', 'Amount (₹)',
      'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Grand Total (₹)'
    ];

    const rows = this.results.map((inv, i) => {
      const data = inv.data;
      const subTotal = (data.items || []).reduce(
        (s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0
      );
      const hamali  = Number(data.hamaliHalt) || 0;
      const taxable = subTotal + hamali;
      const gstType = data.gstType || 'igst';
      const cgst    = gstType === 'cgst_sgst' ? Math.round(taxable * 0.09 * 100) / 100 : 0;
      const sgst    = gstType === 'cgst_sgst' ? Math.round(taxable * 0.09 * 100) / 100 : 0;
      const igst    = gstType === 'igst'      ? Math.round(taxable * 0.18 * 100) / 100 : 0;

      return [
        i + 1,
        inv.invoiceNo || '',
        inv.invoiceDate || '',
        inv.toName || '',
        inv.vehicleNo || data.vehicleNo || '',
        data.toGSTIN || '',
        Math.round(taxable * 100) / 100,
        cgst,
        sgst,
        igst,
        this.roundTotal(inv.grandTotal)
      ];
    });

    // Total row
    rows.push([
      '', '', '', '', '', 'Total',
      this.results.reduce((s, inv) => {
        const sub = (inv.data.items || []).reduce((a, it) => a + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
        return s + Math.round((sub + (Number(inv.data.hamaliHalt) || 0)) * 100) / 100;
      }, 0),
      this.results.reduce((s, inv) => {
        if ((inv.data.gstType || 'igst') !== 'cgst_sgst') return s;
        const sub = (inv.data.items || []).reduce((a, it) => a + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
        return s + Math.round((sub + (Number(inv.data.hamaliHalt) || 0)) * 0.09 * 100) / 100;
      }, 0),
      this.results.reduce((s, inv) => {
        if ((inv.data.gstType || 'igst') !== 'cgst_sgst') return s;
        const sub = (inv.data.items || []).reduce((a, it) => a + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
        return s + Math.round((sub + (Number(inv.data.hamaliHalt) || 0)) * 0.09 * 100) / 100;
      }, 0),
      this.results.reduce((s, inv) => {
        if ((inv.data.gstType || 'igst') !== 'igst') return s;
        const sub = (inv.data.items || []).reduce((a, it) => a + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
        return s + Math.round((sub + (Number(inv.data.hamaliHalt) || 0)) * 0.18 * 100) / 100;
      }, 0),
      this.grandTotal
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Column widths
    worksheet['!cols'] = [
      { wch: 4 }, { wch: 14 }, { wch: 14 }, { wch: 22 },
      { wch: 14 }, { wch: 22 }, { wch: 14 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    const dateStr = this.datePipe.transform(new Date(), 'yyyyMMdd') || 'report';
    XLSX.writeFile(workbook, `Roadlink_Report_${dateStr}.xlsx`);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  private parseInvoiceDate(raw: string): Date | null {
    if (!raw) return null;
    // Try DD/MM/YYYY
    const ddmmyyyy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) {
      return new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`);
    }
    // Try YYYY-MM-DD or anything Date can parse
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }

  goToInvoice(): void { this.router.navigate(['/invoice']); }
  goToHistory(): void { this.router.navigate(['/history']); }
}
