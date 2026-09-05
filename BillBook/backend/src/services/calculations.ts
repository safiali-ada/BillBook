// Round to 2 decimal places using banker's rounding
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateLineSubtotal(quantity: number, sellingPrice: number): number {
  return round2(quantity * sellingPrice);
}

export function calculateItemDiscount(
  subtotal: number,
  discountType: 'NONE' | 'PERCENTAGE' | 'FIXED',
  discountValue: number
): number {
  if (discountType === 'NONE' || discountValue <= 0) return 0;
  if (discountType === 'PERCENTAGE') {
    if (discountValue > 100) throw new Error('Discount percentage cannot exceed 100%');
    return round2(subtotal * discountValue / 100);
  }
  if (discountType === 'FIXED') {
    if (discountValue > subtotal) throw new Error('Discount cannot exceed item subtotal');
    return round2(discountValue);
  }
  return 0;
}

export function calculateLineTotal(subtotal: number, discountAmount: number): number {
  return round2(subtotal - discountAmount);
}

export function calculateInvoiceSubtotal(lineTotals: number[]): number {
  return round2(lineTotals.reduce((sum, t) => sum + t, 0));
}

export function calculateItemDiscountTotal(discountAmounts: number[]): number {
  return round2(discountAmounts.reduce((sum, d) => sum + d, 0));
}

export function calculateInvoiceDiscount(
  subtotalAfterItemDiscounts: number,
  discountType: 'NONE' | 'PERCENTAGE' | 'FIXED',
  discountValue: number
): number {
  if (discountType === 'NONE' || discountValue <= 0) return 0;
  if (discountType === 'PERCENTAGE') {
    if (discountValue > 100) throw new Error('Invoice discount percentage cannot exceed 100%');
    return round2(subtotalAfterItemDiscounts * discountValue / 100);
  }
  if (discountType === 'FIXED') {
    if (discountValue > subtotalAfterItemDiscounts) throw new Error('Invoice discount cannot exceed subtotal');
    return round2(discountValue);
  }
  return 0;
}

export function calculateTaxableAmount(
  subtotal: number,
  itemDiscountTotal: number,
  invoiceDiscountAmount: number
): number {
  return round2(subtotal - itemDiscountTotal - invoiceDiscountAmount);
}

export function calculateGST(taxableAmount: number, gstRate: number): number {
  if (gstRate <= 0) return 0;
  if (gstRate > 100) throw new Error('GST rate cannot exceed 100%');
  return round2(taxableAmount * gstRate / 100);
}

export function calculateGrandTotal(taxableAmount: number, gstAmount: number): number {
  return round2(taxableAmount + gstAmount);
}

// Full invoice calculation from items
export interface CalcInvoiceItem {
  quantity: number;
  selling_price: number;
  discount_type: 'NONE' | 'PERCENTAGE' | 'FIXED';
  discount_value: number;
}

export interface InvoiceCalculationResult {
  items: {
    subtotal: number;
    discount_amount: number;
    total: number;
  }[];
  subtotal: number;
  item_discount_total: number;
  invoice_discount_amount: number;
  taxable_amount: number;
  gst_amount: number;
  grand_total: number;
}

export function calculateFullInvoice(
  items: CalcInvoiceItem[],
  invoiceDiscountType: 'NONE' | 'PERCENTAGE' | 'FIXED',
  invoiceDiscountValue: number,
  gstEnabled: boolean,
  gstRate: number
): InvoiceCalculationResult {
  const calculatedItems = items.map((item) => {
    const subtotal = calculateLineSubtotal(item.quantity, item.selling_price);
    const discount_amount = calculateItemDiscount(subtotal, item.discount_type, item.discount_value);
    const total = calculateLineTotal(subtotal, discount_amount);
    return { subtotal, discount_amount, total };
  });

  const subtotal = round2(calculatedItems.reduce((sum, i) => sum + i.subtotal, 0));
  const item_discount_total = round2(calculatedItems.reduce((sum, i) => sum + i.discount_amount, 0));
  const subtotalAfterItemDiscounts = round2(subtotal - item_discount_total);
  const invoice_discount_amount = calculateInvoiceDiscount(subtotalAfterItemDiscounts, invoiceDiscountType, invoiceDiscountValue);
  const taxable_amount = calculateTaxableAmount(subtotal, item_discount_total, invoice_discount_amount);
  const gst_amount = gstEnabled ? calculateGST(taxable_amount, gstRate) : 0;
  const grand_total = calculateGrandTotal(taxable_amount, gst_amount);

  return {
    items: calculatedItems,
    subtotal,
    item_discount_total,
    invoice_discount_amount,
    taxable_amount,
    gst_amount,
    grand_total,
  };
}
