import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { InvoiceData, InvoiceItem } from '../invoice/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  async generateInvoice(data: InvoiceData): Promise<void> {
    // Fetch the real logo PNG as base64
    const logoDataUri = await this.loadImageAsDataUri('assets/logo.png');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pW = 210;
    const m = 10;           // margin
    const iW = pW - m * 2; // inner width = 190

    // ─── Outer border (top only — sides+bottom drawn after last row) ───────────
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(m, m, m + iW, m);           // top only

    // ─── HEADER ROW (height 30mm) ────────────────────────────────────
    // GST top-left
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`GST ${data.companyGST || '33BEEPN3956H1ZF'}`, m + 2, m + 5);

    // Mobile & Email top-right
    doc.setFontSize(8);
    doc.text('Mobile : 9994919189', pW - m - 2, m + 5, { align: 'right' });
    doc.text('E-Mail : roadlinkcargoscbe@gmail.com', pW - m - 2, m + 10, { align: 'right' });

    // INVOICE title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pW / 2, m + 6, { align: 'center' });

    // Actual logo image (PNG) — centred, 52mm wide × 16mm tall
    doc.addImage(logoDataUri, 'PNG', (pW - 52) / 2, m + 7, 52, 16);

    // Tagline & address
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('We carry your goods & Trust', pW / 2, m + 26, { align: 'center' });
    doc.text('6, Viswasapuram, Saravanampatti post, Coimbatore -35', pW / 2, m + 31, { align: 'center' });

    const hdrBottom = m + 34;
    doc.setLineWidth(0.5);
    doc.line(m, hdrBottom, m + iW, hdrBottom);

    // ─── TO / INVOICE-NO + GSTIN ROW ────────────────────────────────
    const infoBoxW = 58;
    const infoX    = m + iW - infoBoxW;
    const toRowEnd = hdrBottom + 26;   // increased for Vehicle No. breathing room

    // Single bottom line — vertical divider & horizontal border all meet here
    const gstinBottom = toRowEnd;  // no separate GSTIN row; GSTIN is inside left panel

    // Vertical divider — full height of combined To+GSTIN+right-box section
    doc.setLineWidth(0.5);
    doc.line(infoX, hdrBottom, infoX, toRowEnd);

    // Left panel: "To" label + name at top
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('To', m + 2, hdrBottom + 6);
    doc.setFont('helvetica', 'normal');
    const toNameLines = (data.toName || '').split('\n');
    toNameLines.forEach((line, idx) => {
      doc.text(line, m + 9, hdrBottom + 6 + idx * 4.5);
    });

    // Left panel: GSTIN at bottom, aligned with Vehicle No. row
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`GSTIN : ${data.toGSTIN || ''}`, m + 2, toRowEnd - 3);

    // Single bottom border spanning full width
    doc.setLineWidth(0.5);
    doc.line(m, toRowEnd, m + iW, toRowEnd);

    // Right box — Row 1: INVOICE No. label (bold, left) + value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('INVOICE No.', infoX + 2, hdrBottom + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(data.invoiceNo || '', infoX + 28, hdrBottom + 6);

    // Divider after row 1
    doc.setLineWidth(0.3);
    doc.line(infoX, hdrBottom + 9, m + iW, hdrBottom + 9);

    // Row 2: Date
    doc.text('Date :', infoX + 2, hdrBottom + 15);
    doc.text(data.invoiceDate || '', infoX + 18, hdrBottom + 15);

    // Divider after row 2
    doc.line(infoX, hdrBottom + 18, m + iW, hdrBottom + 18);

    // Row 3: Vehicle No. — 5mm above bottom border so text doesn't stick
    doc.text('Vehicle No.', infoX + 2, hdrBottom + 23);
    doc.text(data.vehicleNo || '', infoX + 24, hdrBottom + 23);

    // ─── FROM / TO ROW (height 18mm) ────────────────────────────────
    const midX = m + iW / 2;
    const fromToEnd = gstinBottom + 18;
    doc.setLineWidth(0.3);
    doc.line(midX, gstinBottom, midX, fromToEnd);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('From', m + 2, gstinBottom + 5);
    doc.text('To', midX + 2, gstinBottom + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const fromLines = doc.splitTextToSize(data.fromAddress || '', iW / 2 - 6);
    doc.text(fromLines, m + 2, gstinBottom + 10);
    const toLines = doc.splitTextToSize(data.toAddress || '', iW / 2 - 6);
    doc.text(toLines, midX + 2, gstinBottom + 10);

    doc.setLineWidth(0.5);
    doc.line(m, fromToEnd, m + iW, fromToEnd);

    // ─── TABLE HEADER ────────────────────────────────────────────────
    // Column widths (total = 190)
    const cSn   = 12;   // S.No.
    const cDesc = 118;  // Description (wider)
    const cQty  = 15;   // Qty
    const cRate = 22;   // Rate
    const cAmt  = 23;   // Amount

    const thY = fromToEnd;
    const thH = 8;

    doc.setFillColor(240, 240, 240);
    doc.rect(m, thY, iW, thH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const tcy = thY + 5.5;
    doc.text('S.No.',      m + 2,                             tcy);
    doc.text('Description', m + cSn + 2,                     tcy);
    doc.text('Qty.',        m + cSn + cDesc + 2,              tcy);
    doc.text('Rate',        m + cSn + cDesc + cQty + 2,       tcy);
    doc.text('Amount',      m + cSn + cDesc + cQty + cRate + 2, tcy);

    // vertical col dividers — header only (will extend below after rows)
    doc.setLineWidth(0.3);
    const drawVDiv = (ox: number) => doc.line(m + ox, thY, m + ox, thY + thH);
    drawVDiv(cSn);
    drawVDiv(cSn + cDesc);
    drawVDiv(cSn + cDesc + cQty);
    drawVDiv(cSn + cDesc + cQty + cRate);

    doc.setLineWidth(0.5);
    doc.line(m, thY + thH, m + iW, thY + thH);

    // ─── TABLE ROWS (12 rows × 8mm) ─────────────────────────────────
    const rowH = 8;
    const maxRows = 12;
    const items = data.items || [];
    let curY = thY + thH;

    for (let i = 0; i < maxRows; i++) {
      const item: InvoiceItem | undefined = items[i];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);

      if (item) {
        doc.text(`${i + 1}`, m + 2, curY + 5.5);
        const desc0 = doc.splitTextToSize(item.description || '', cDesc - 4)[0] || '';
        doc.text(desc0, m + cSn + 2, curY + 5.5);
        doc.text(String(item.qty ?? ''), m + cSn + cDesc + 2, curY + 5.5);
        doc.text(String(item.rate ?? ''), m + cSn + cDesc + cQty + 2, curY + 5.5);
        const amt = (Number(item.qty) || 0) * (Number(item.rate) || 0);
        doc.setFont('helvetica', 'bold');
        doc.text(amt > 0 ? amt.toFixed(2) : '', m + iW - 2, curY + 5.5, { align: 'right' });
      }

      curY += rowH;
    }

    // Draw full-height vertical column dividers spanning all item rows
    const tableBodyEnd = curY;

    doc.setLineWidth(0.3);
    doc.line(m + cSn,                          thY + thH, m + cSn,                          tableBodyEnd);
    doc.line(m + cSn + cDesc,                  thY + thH, m + cSn + cDesc,                  tableBodyEnd);
    doc.line(m + cSn + cDesc + cQty,           thY + thH, m + cSn + cDesc + cQty,           tableBodyEnd);
    doc.line(m + cSn + cDesc + cQty + cRate,   thY + thH, m + cSn + cDesc + cQty + cRate,   tableBodyEnd);

    // ─── COMPUTE TOTALS ──────────────────────────────────────────────
    const subTotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
    const hamali   = Number(data.hamaliHalt) || 0;
    const taxable  = subTotal + hamali;
    const gstType  = data.gstType || 'igst';
    const csgt     = gstType === 'cgst_sgst' ? taxable * 0.09 : 0;
    const sgst     = gstType === 'cgst_sgst' ? taxable * 0.09 : 0;
    const igst     = gstType === 'igst'      ? taxable * 0.18 : 0;
    const grand    = taxable + csgt + sgst + igst;

    // Column anchors reused for summary alignment
    const sumX      = m + cSn + cDesc;                    // left of Qty  (= 140mm) — main divider
    const rateAmtX  = m + cSn + cDesc + cQty + cRate;     // Rate/Amount divider (= 177mm)

    // ─── HAMALI/HALT + TOTAL rows (right cols, above bank section) ───
    const aboveRows: { label: string; value: string; bold?: boolean }[] = [
      { label: 'Hamali/Halt', value: hamali > 0 ? hamali.toFixed(2) : '' },
      { label: 'TOTAL',       value: subTotal > 0 ? subTotal.toFixed(2) : '', bold: true },
    ];

    // Extend column dividers through these 2 rows — NO Qty/Rate divider here
    const preRowsEndY = tableBodyEnd + aboveRows.length * rowH;
    doc.setLineWidth(0.3);
    doc.line(m + cSn,  tableBodyEnd, m + cSn,  preRowsEndY);
    doc.line(sumX,     tableBodyEnd, sumX,     preRowsEndY);
    doc.line(rateAmtX, tableBodyEnd, rateAmtX, preRowsEndY);

    // Top border of Hamali/Halt (only over right cols)
    doc.setLineWidth(0.5);
    doc.line(sumX, tableBodyEnd, m + iW, tableBodyEnd);

    let sY = tableBodyEnd;
    for (const row of aboveRows) {
      doc.setFont('helvetica', row.bold ? 'bold' : 'normal');
      doc.setFontSize(8.5);
      doc.text(row.label, sumX + 2, sY + 5.5);
      doc.text(row.value, m + iW - 2, sY + 5.5, { align: 'right' });
      doc.setLineWidth(0.3);
      doc.line(sumX, sY + rowH, m + iW, sY + rowH);
      sY += rowH;
    }

    // ─── BANK DETAILS + CSGT/SGST/IGST/GRAND TOTAL side by side ────
    const bankRows: { label: string; value: string; bold?: boolean }[] = [
      { label: 'CSGT  9 %',  value: csgt > 0 ? csgt.toFixed(2) : '' },
      { label: 'SGST  9 %',  value: sgst > 0 ? sgst.toFixed(2) : '' },
      { label: 'IGST  18 %', value: igst > 0 ? igst.toFixed(2) : '' },
      { label: 'Grand Total',value: grand > 0 ? grand.toFixed(2) : '', bold: true },
    ];

    const footY    = preRowsEndY;
    const bankH    = Math.max(bankRows.length * rowH, 32); // right side: 4×8=32; left needs ~32 for bank text
    const bankEndY = footY + bankH;
    const bankMidX = sumX; // vertical divider aligned with Qty column left edge

    doc.setLineWidth(0.5);
    doc.line(m, footY, m + iW, footY);      // full-width line above bank details
    doc.line(m, bankEndY, m + iW, bankEndY);
    doc.line(bankMidX, footY, bankMidX, bankEndY);
    // Rate/Amount divider continues through bank right section
    doc.setLineWidth(0.3);
    doc.line(rateAmtX, footY, rateAmtX, bankEndY);

    // ── Left: Bank Details ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('BANK DETAILS', m + 4, footY + 7);
    doc.setLineWidth(0.4);
    doc.line(m + 4, footY + 8, m + 36, footY + 8);

    const bL  = m + 4;
    const bV  = m + 34;
    const bR  = m + 72;
    const bRV = m + 92;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Bank Details Name :', bL, footY + 16);
    doc.setFont('helvetica', 'bold');
    doc.text('Road-Link Cargos', bV, footY + 16);
    doc.setFont('helvetica', 'normal');
    doc.text('Account No :', bR, footY + 16);
    doc.setFont('helvetica', 'bold');
    doc.text('50200089082007', bRV, footY + 16);

    doc.setFont('helvetica', 'normal');
    doc.text('Branch           :', bL, footY + 23);
    doc.setFont('helvetica', 'bold');
    doc.text('Ramakrishnapuram', bV, footY + 23);
    doc.setFont('helvetica', 'normal');
    doc.text('IFSC Code :', bR, footY + 23);
    doc.setFont('helvetica', 'bold');
    doc.text('HDFC0008887', bRV, footY + 23);

    doc.setFont('helvetica', 'normal');
    doc.text('Bank              :', bL, footY + 30);
    doc.setFont('helvetica', 'bold');
    doc.text('HDFC BANK', bV, footY + 30);

    // ── Right: CSGT, SGST, IGST, Grand Total ──
    let rY = footY;
    for (let i = 0; i < bankRows.length; i++) {
      const row = bankRows[i];
      const isLast = i === bankRows.length - 1;
      doc.setFont('helvetica', row.bold ? 'bold' : 'normal');
      doc.setFontSize(8.5);
      doc.text(row.label, bankMidX + 2, rY + 5.5);
      doc.text(row.value, m + iW - 2, rY + 5.5, { align: 'right' });
      // skip bottom line for last row — bankEndY full-width line covers it
      if (!isLast) {
        doc.setLineWidth(0.3);
        doc.line(bankMidX, rY + rowH, m + iW, rY + rowH);
      }
      rY += rowH;
    }

    // ─── TOTAL IN WORDS + FOR ROAD LINK CARGOS (same row, no divider) ──
    const wordsY    = bankEndY;
    const wordsEndY = wordsY + 22;

    doc.setLineWidth(0.5);
    doc.line(m, wordsEndY, m + iW, wordsEndY);
    doc.line(bankMidX, wordsY, bankMidX, wordsEndY); // vertical divider restored

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Total Value (in words)', m + 2, wordsY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const wordsStr = grand > 0 ? `INR ${this.numberToWords(grand)} Only` : '';
    const wLines   = doc.splitTextToSize(wordsStr, bankMidX - m - 6);
    doc.text(wLines, m + 2, wordsY + 12);

    // Right side of same row: For Road Link Cargos + Authorised Signatory
    const rightCx = bankMidX + (m + iW - bankMidX) / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('For Road Link Cargos', rightCx, wordsY + 6, { align: 'center' }); // same level as Total Value label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Authorised Signatory', rightCx, wordsEndY - 3, { align: 'center' });

    // Close outer border bottom exactly at last row
    doc.setLineWidth(0.5);
    doc.line(m, wordsEndY, m + iW, wordsEndY);
    // Clip side lines to actual content height
    doc.setLineWidth(0.5);
    doc.line(m,      m, m,      wordsEndY);
    doc.line(m + iW, m, m + iW, wordsEndY);

    doc.save(`RoadLink_Invoice_${data.invoiceNo || 'draft'}.pdf`);
  }

  private loadImageAsDataUri(url: string): Promise<string> {
    return fetch(url)
      .then(r => r.blob())
      .then(blob => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }));
  }

  private numberToWords(num: number): string {
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
    };

    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);
    let result = inWords(intPart) + ' Rupees';
    if (decPart > 0) {
      result += ' and ' + inWords(decPart) + ' Paise';
    }
    return result;
  }
}
