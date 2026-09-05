import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoicePDFData {
  // Business info
  business_name: string;
  business_phone?: string | null;
  business_email?: string | null;
  business_address?: string | null;
  business_gstin?: string | null;

  // Invoice info
  invoice_number: string;
  invoice_date: string;
  status: string;

  // Customer info
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_gstin?: string | null;

  // Items
  items: {
    product_name_snapshot: string;
    sku_snapshot?: string | null;
    unit_snapshot?: string | null;
    quantity: number;
    original_price: number;
    selling_price: number;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
    subtotal: number;
    total: number;
  }[];

  // Totals
  subtotal: number;
  item_discount_total: number;
  invoice_discount_type: string;
  invoice_discount_value: number;
  invoice_discount_amount: number;
  taxable_amount: number;
  gst_enabled: boolean;
  gst_rate: number;
  gst_amount: number;
  grand_total: number;
  notes?: string | null;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateStr(dateStr: string): string {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function generateInvoicePDF(data: InvoicePDFData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const primaryColor: [number, number, number] = [37, 99, 235]; // primary-600
  const darkGray: [number, number, number] = [31, 41, 55];
  const mediumGray: [number, number, number] = [107, 114, 128];
  const lightGray: [number, number, number] = [229, 231, 235];

  // ── Header: Business Name ──
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(data.business_name, margin, y + 8);

  // INVOICE label on the right
  doc.setFontSize(28);
  doc.setTextColor(...lightGray);
  doc.text('INVOICE', pageWidth - margin, y + 8, { align: 'right' });

  y += 16;

  // Business details
  doc.setFontSize(8);
  doc.setTextColor(...mediumGray);
  doc.setFont('helvetica', 'normal');
  const businessLines: string[] = [];
  if (data.business_address) businessLines.push(data.business_address);
  if (data.business_phone) businessLines.push(`Phone: ${data.business_phone}`);
  if (data.business_email) businessLines.push(`Email: ${data.business_email}`);
  if (data.business_gstin) businessLines.push(`GSTIN: ${data.business_gstin}`);

  businessLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 3.5;
  });

  y += 4;

  // ── Separator line ──
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Invoice Info & Customer Info (two columns) ──
  const colLeft = margin;
  const colRight = pageWidth / 2 + 5;

  // Left column: Invoice details
  doc.setFontSize(9);
  doc.setTextColor(...mediumGray);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE DETAILS', colLeft, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 5;

  doc.setTextColor(...darkGray);
  doc.text(`Invoice No:  ${data.invoice_number}`, colLeft, y);
  y += 4.5;
  doc.text(`Date:  ${formatDateStr(data.invoice_date)}`, colLeft, y);
  y += 4.5;
  doc.text(`Status:  ${data.status}`, colLeft, y);

  // Right column: Customer details
  let yRight = y - 14;
  doc.setFontSize(9);
  doc.setTextColor(...mediumGray);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', colRight, yRight);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  yRight += 5;

  doc.setTextColor(...darkGray);
  doc.text(data.customer_name || 'Walk-in Customer', colRight, yRight);
  yRight += 4.5;
  if (data.customer_phone) {
    doc.text(`Phone: ${data.customer_phone}`, colRight, yRight);
    yRight += 4.5;
  }
  if (data.customer_address) {
    const addressLines = doc.splitTextToSize(data.customer_address, contentWidth / 2 - 10);
    addressLines.forEach((line: string) => {
      doc.text(line, colRight, yRight);
      yRight += 4;
    });
  }
  if (data.customer_gstin) {
    doc.text(`GSTIN: ${data.customer_gstin}`, colRight, yRight);
    yRight += 4.5;
  }

  y = Math.max(y, yRight) + 8;

  // ── Items Table ──
  const tableColumns = [
    { header: '#', dataKey: 'sno' },
    { header: 'Item', dataKey: 'item' },
    { header: 'Qty', dataKey: 'qty' },
    { header: 'Rate', dataKey: 'rate' },
    { header: 'Discount', dataKey: 'discount' },
    { header: 'Amount', dataKey: 'amount' },
  ];

  const tableRows = data.items.map((item, idx) => {
    let discountStr = '-';
    if (item.discount_type === 'PERCENTAGE' && item.discount_value > 0) {
      discountStr = `${item.discount_value}% (${formatINR(item.discount_amount)})`;
    } else if (item.discount_type === 'FIXED' && item.discount_value > 0) {
      discountStr = formatINR(item.discount_amount);
    }

    return {
      sno: (idx + 1).toString(),
      item: item.product_name_snapshot + (item.sku_snapshot ? `\n${item.sku_snapshot}` : ''),
      qty: `${item.quantity} ${item.unit_snapshot || 'pcs'}`,
      rate: formatINR(item.selling_price),
      discount: discountStr,
      amount: formatINR(item.total),
    };
  });

  autoTable(doc, {
    startY: y,
    columns: tableColumns,
    body: tableRows,
    theme: 'striped',
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: darkGray,
      lineColor: lightGray,
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      sno: { cellWidth: 10, halign: 'center' },
      item: { cellWidth: 'auto' },
      qty: { cellWidth: 22, halign: 'center' },
      rate: { cellWidth: 30, halign: 'right' },
      discount: { cellWidth: 35, halign: 'right' },
      amount: { cellWidth: 32, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Totals Section ──
  const totalsX = pageWidth - margin - 80;
  const totalsValueX = pageWidth - margin;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mediumGray);

  // Subtotal
  doc.text('Subtotal', totalsX, y);
  doc.setTextColor(...darkGray);
  doc.text(formatINR(data.subtotal), totalsValueX, y, { align: 'right' });
  y += 5;

  // Item discounts
  if (data.item_discount_total > 0) {
    doc.setTextColor(...mediumGray);
    doc.text('Item Discounts', totalsX, y);
    doc.setTextColor(22, 163, 74); // green
    doc.text(`-${formatINR(data.item_discount_total)}`, totalsValueX, y, { align: 'right' });
    y += 5;
  }

  // Invoice discount
  if (data.invoice_discount_amount > 0) {
    doc.setTextColor(...mediumGray);
    const discLabel =
      data.invoice_discount_type === 'PERCENTAGE'
        ? `Invoice Discount (${data.invoice_discount_value}%)`
        : 'Invoice Discount';
    doc.text(discLabel, totalsX, y);
    doc.setTextColor(22, 163, 74);
    doc.text(`-${formatINR(data.invoice_discount_amount)}`, totalsValueX, y, { align: 'right' });
    y += 5;
  }

  // Taxable amount
  doc.setTextColor(...mediumGray);
  doc.text('Taxable Amount', totalsX, y);
  doc.setTextColor(...darkGray);
  doc.text(formatINR(data.taxable_amount), totalsValueX, y, { align: 'right' });
  y += 5;

  // GST
  if (data.gst_enabled && data.gst_amount > 0) {
    doc.setTextColor(...mediumGray);
    doc.text(`GST @ ${data.gst_rate}%`, totalsX, y);
    doc.setTextColor(...darkGray);
    doc.text(formatINR(data.gst_amount), totalsValueX, y, { align: 'right' });
    y += 5;
  }

  // Grand total line
  y += 1;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 5, y, totalsValueX, y);
  y += 6;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Grand Total', totalsX, y);
  doc.text(formatINR(data.grand_total), totalsValueX, y, { align: 'right' });

  y += 12;

  // ── Notes ──
  if (data.notes) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mediumGray);
    doc.text('Notes:', margin, y);
    doc.setFont('helvetica', 'normal');
    y += 4;
    const noteLines = doc.splitTextToSize(data.notes, contentWidth);
    noteLines.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 3.5;
    });
  }

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(7);
  doc.setTextColor(...mediumGray);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer-generated invoice.', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Generated by BillBook`, pageWidth / 2, footerY + 3.5, { align: 'center' });

  return doc;
}

export function downloadInvoicePDF(data: InvoicePDFData): void {
  const doc = generateInvoicePDF(data);
  doc.save(`${data.invoice_number}.pdf`);
}

export function printInvoicePDF(data: InvoicePDFData): void {
  const doc = generateInvoicePDF(data);
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(url);
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
