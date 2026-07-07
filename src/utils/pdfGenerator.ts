import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { useAuthStore } from '../context/store';

const getCompanyName = () => useAuthStore.getState().user?.companyName?.toUpperCase() || 'CHILLSTOCK';
export const generateReportPDF = (
  branchName: string,
  dateRange: { from: string; to: string },
  salesData: any[],
  totalRevenue: number,
  topProduct?: { name: string; qty: number }
) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }) as any;
  const pageW = 210;
  const margin = 15;

  const fromStr = dateRange.from ? format(new Date(dateRange.from), 'dd MMM yyyy') : 'Start';
  const toStr = dateRange.to ? format(new Date(dateRange.to), 'dd MMM yyyy') : 'End';

  // ── HEADER ──
  doc.setDrawColor(0);
  doc.setLineWidth(0.8);
  doc.line(margin, 12, pageW - margin, 12);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(getCompanyName(), margin, 23);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Ice Cream & Dairy Products', margin, 28);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES REPORT', pageW - margin, 23, { align: 'right' });

  doc.setLineWidth(0.8);
  doc.line(margin, 32, pageW - margin, 32);

  // ── DETAILS SECTION ──
  let y = 39;
  const labelX = margin;
  const valX = margin + 28;
  const rightLabelX = 130;
  const rightValX = 152;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Branch:', labelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(branchName, valX, y);

  doc.setFont('helvetica', 'bold');
  doc.text('From:', rightLabelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(fromStr, rightValX, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Revenue:', labelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rs. ${totalRevenue.toFixed(2)}`, valX, y);

  doc.setFont('helvetica', 'bold');
  doc.text('To:', rightLabelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(toStr, rightValX, y);

  if (topProduct) {
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Top Product:', labelX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${topProduct.name} (${topProduct.qty} units)`, valX, y);
  }

  y += 5;
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);

  // ── TABLE ──
  y += 2;
  const isAllBranches = branchName === 'All Branches';
  const tableColumn = isAllBranches
    ? ['#', 'Date', 'Branch', 'Item', 'Qty', 'Price (Rs.)', 'Total (Rs.)', 'Profit (Rs.)']
    : ['#', 'Date', 'Item', 'Category', 'Qty', 'Price (Rs.)', 'Total (Rs.)', 'Profit (Rs.)'];

  const tableRows: any[] = [];
  salesData.forEach((sale, idx) => {
    const row: string[] = [(idx + 1).toString(), format(new Date(sale.createdAt), 'dd MMM yy')];
    if (isAllBranches) {
      row.push(sale.branchId?.name || 'Unknown');
    }
    const product = sale.productId || sale.globalProductId || {};
    row.push(
      product.name || 'Unknown',
    );
    if (!isAllBranches) {
      row.push(product.category || '-');
    }
    row.push(
      sale.quantity.toString(),
      (sale.priceAtSale || sale.price || sale.transferRate || product.price || 0).toFixed(2),
      sale.totalAmount.toFixed(2),
      sale.totalProfit !== undefined ? sale.totalProfit.toFixed(2) : '-'
    );
    tableRows.push(row);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: y,
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [235, 235, 235],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
      fontSize: 8,
    },
    bodyStyles: {
      lineWidth: 0.2,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22 },
      [isAllBranches ? 4 : 4]: { cellWidth: 12, halign: 'center' },
      [isAllBranches ? 5 : 5]: { cellWidth: 22, halign: 'right' },
      [isAllBranches ? 6 : 6]: { cellWidth: 22, halign: 'right' },
      [isAllBranches ? 7 : 7]: { cellWidth: 22, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  // ── TOTALS ──
  const finalY = (doc as any).lastAutoTable?.finalY || y + 30;
  let ty = finalY + 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Records: ${salesData.length}`, margin, ty);
  doc.text(`Total Qty: ${salesData.reduce((s: number, i: any) => s + (i.quantity || 0), 0)}`, margin + 45, ty);

  ty += 3;
  doc.setLineWidth(0.3);
  doc.line(pageW - margin - 75, ty, pageW - margin, ty);

  ty += 7;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL REVENUE:', pageW - margin - 75, ty);
  doc.text(`Rs. ${totalRevenue.toFixed(2)}`, pageW - margin, ty, { align: 'right' });

  ty += 3;
  doc.setLineWidth(0.8);
  doc.line(pageW - margin - 75, ty, pageW - margin, ty);

  // ── FOOTER ──
  const pageH = doc.internal.pageSize.getHeight();
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 15, pageW - margin, pageH - 15);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer generated report.', pageW / 2, pageH - 11, { align: 'center' });
  doc.text(getCompanyName() + ' - Ice Cream & Dairy Products', pageW / 2, pageH - 7, { align: 'center' });

  doc.save(`${branchName.replace(/\s+/g, '_')}_Sales_Report_${Date.now()}.pdf`);
};

export const generateTransferReceiptPDF = (
  branchName: string,
  managerName: string,
  items: any[],
  total: number,
  download: boolean = true
) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }) as any;
  const pageW = 210;
  const margin = 15;

  // ── HEADER ──
  doc.setDrawColor(0);
  doc.setLineWidth(0.8);
  doc.line(margin, 12, pageW - margin, 12);

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(getCompanyName(), margin, 24);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Ice Cream & Dairy Products', margin, 30);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('STOCK TRANSFER INVOICE', pageW - margin, 24, { align: 'right' });

  doc.setLineWidth(0.8);
  doc.line(margin, 34, pageW - margin, 34);

  // ── DETAILS SECTION ──
  let y = 42;
  const labelX = margin;
  const valX = margin + 28;
  const rightLabelX = 135;
  const rightValX = 155;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Transfer To:', labelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(branchName, valX, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', rightLabelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(), 'dd MMM yyyy'), rightValX, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Manager:', labelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(managerName, valX, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Time:', rightLabelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(), 'hh:mm a'), rightValX, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No:', labelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`INV-${Date.now().toString().slice(-8)}`, valX, y);

  y += 6;
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);

  // ── TABLE ──
  y += 2;
  const tableHead = [['#', 'Product Name', 'Unit', 'Qty', 'Rate (Rs.)', 'Amount (Rs.)']];
  const tableBody = items.map((item, i) => [
    (i + 1).toString(),
    item.name,
    item.unit || 'pcs',
    item.quantity.toString(),
    item.price.toFixed(2),
    (item.price * item.quantity).toFixed(2)
  ]);

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: y,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [235, 235, 235],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
    },
    bodyStyles: {
      lineWidth: 0.2,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 32, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  // ── TOTALS ──
  const finalY = (doc as any).lastAutoTable?.finalY || y + 30;
  let ty = finalY + 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Items: ${items.length}`, margin, ty);
  doc.text(`Total Quantity: ${items.reduce((s: number, i: any) => s + i.quantity, 0)}`, margin + 50, ty);

  ty += 4;
  doc.setLineWidth(0.3);
  doc.line(pageW - margin - 75, ty, pageW - margin, ty);

  ty += 8;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL VALUE:', pageW - margin - 75, ty);
  doc.text(`Rs. ${total.toFixed(2)}`, pageW - margin, ty, { align: 'right' });

  ty += 3;
  doc.setLineWidth(0.8);
  doc.line(pageW - margin - 75, ty, pageW - margin, ty);

  // ── SIGNATURE SECTION ──
  ty += 25;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setLineWidth(0.3);

  doc.line(margin, ty, margin + 55, ty);
  doc.text('Authorized Signature', margin, ty + 5);

  doc.line(pageW - margin - 55, ty, pageW - margin, ty);
  doc.text('Received By', pageW - margin - 55, ty + 5);

  // ── FOOTER ──
  const pageH = doc.internal.pageSize.getHeight();
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 18, pageW - margin, pageH - 18);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer generated invoice.', pageW / 2, pageH - 13, { align: 'center' });
  doc.text(getCompanyName() + ' - Ice Cream & Dairy Products', pageW / 2, pageH - 9, { align: 'center' });

  if (download) {
    doc.save(`Transfer_Invoice_${branchName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  }
  return doc.output('datauristring');
};

export const generateReceiptPDF = (
  branchName: string,
  items: any[],
  total: number,
  download: boolean = true
) => {
  // dynamic height calculation based on items
  const height = Math.max(200, 60 + (items.length * 8));
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, height] // 80mm thermal paper width
  });

  // Header Layout
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(getCompanyName(), 40, 12, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(branchName, 40, 18, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt Date: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 40, 23, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(5, 27, 75, 27);

  // Table Headers
  let y = 32;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ITEM DESC', 5, y);
  doc.text('QTY', 48, y, { align: 'center' });
  doc.text('AMOUNT', 75, y, { align: 'right' });
  
  y += 3;
  doc.setLineWidth(0.2);
  doc.line(5, y, 75, y);
  y += 5;

  // Items List
  doc.setFont('helvetica', 'normal');
  items.forEach(item => {
    // Break product name if too long
    const name = `${item.name} (${item.unit})`.slice(0, 24);
    doc.text(name, 5, y);
    doc.text(item.quantity.toString(), 48, y, { align: 'center' });
    const amount = (item.price * item.quantity).toFixed(2);
    doc.text(amount, 75, y, { align: 'right' });
    if(item.note) {
      y += 4;
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(`* ${item.note.slice(0,30)}`, 7, y);
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
    }
    y += 6;
  });

  doc.setLineWidth(0.5);
  doc.line(5, y, 75, y);
  y += 6;

  // Totals
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 5, y);
  doc.text(`Rs. ${total.toFixed(2)}`, 75, y, { align: 'right' });
  
  y += 12;
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for choosing ' + getCompanyName() + '!', 40, y, { align: 'center' });
  doc.setTextColor(150, 150, 150);
  doc.text('Visit again', 40, y + 4, { align: 'center' });

  if (download) {
    doc.save(`receipt_${Date.now()}.pdf`);
  }
  return doc.output('datauristring');
};

export const generateStockFlowPDF = (
  dateRange: { from: string; to: string },
  stockFlowData: any[],
  totals: { totalIn: number; totalOut: number; totalStock: number }
) => {
  const doc = new jsPDF() as any;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(getCompanyName() + ' - Stock Flow Report', 14, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const fromStr = dateRange.from ? format(new Date(dateRange.from), 'dd MMM yyyy') : 'Start';
  const toStr = dateRange.to ? format(new Date(dateRange.to), 'dd MMM yyyy') : 'End';
  doc.text(`Date Range: ${fromStr} to ${toStr}`, 14, 30);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Stock IN: ${totals.totalIn} units`, 14, 40);
  doc.text(`Total Stock OUT: ${totals.totalOut} units`, 70, 40);
  doc.text(`Current Global Stock: ${totals.totalStock} units`, 140, 40);

  const tableColumn = ["Product", "SKU", "Stock IN", "Stock OUT", "Remaining", "Out to Branches"];

  const tableRows: any[] = [];

  stockFlowData.forEach(item => {
    const branchDetails = item.branchesOut.length > 0 
      ? item.branchesOut.map((b: any) => `${b.branchName}: ${b.quantity}`).join(', ') 
      : '-';

    const row = [
      item.productName,
      item.sku,
      item.totalIn.toString(),
      item.totalOut.toString(),
      item.currentGlobalStock.toString(),
      branchDetails
    ];
    tableRows.push(row);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 48,
    theme: 'striped',
    headStyles: { fillColor: [234, 179, 8] }, // yellow-500 equivalent for Stock
    columnStyles: {
      5: { cellWidth: 60 } // give more width to branches
    }
  });

  doc.save(`Stock_Flow_Report_${Date.now()}.pdf`);
};

export const generateActivityLogPDF = (logs: any[], dateRange: { from: string; to: string }) => {
  const doc = new jsPDF() as any;
  const pageW = 210;
  const margin = 14;

  let dateRangeText = "All Time";
  if (dateRange.from && dateRange.to) {
    const fromStr = format(new Date(dateRange.from), 'dd MMM yyyy');
    const toStr = format(new Date(dateRange.to), 'dd MMM yyyy');
    dateRangeText = `${fromStr} to ${toStr}`;
  } else if (dateRange.from) {
    const fromStr = format(new Date(dateRange.from), 'dd MMM yyyy');
    dateRangeText = `From ${fromStr}`;
  } else if (dateRange.to) {
    const toStr = format(new Date(dateRange.to), 'dd MMM yyyy');
    dateRangeText = `Up to ${toStr}`;
  }

  // Header
  doc.setDrawColor(0);
  doc.setLineWidth(0.8);
  doc.line(margin, 12, pageW - margin, 12);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(getCompanyName(), margin, 23);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ACTIVITY LOGS', pageW - margin, 23, { align: 'right' });

  doc.setLineWidth(0.8);
  doc.line(margin, 32, pageW - margin, 32);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date Range: ${dateRangeText}`, margin, 40);

  const tableColumn = ["Date & Time", "Action", "Details"];
  const tableRows: any[] = [];

  logs.forEach(log => {
    // Basic text sanitization for PDF (removing HTML tags that might have been used in UI)
    const sanitizedDetails = log.details.replace(/<[^>]*>?/gm, '');
    const row = [
      format(new Date(log.createdAt), 'dd MMM yyyy, h:mm a'),
      log.action,
      sanitizedDetails
    ];
    tableRows.push(row);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] }, // indigo-600
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 40 },
      2: { cellWidth: 'auto' }
    }
  });

  doc.save(`Activity_Logs_${Date.now()}.pdf`);
};
