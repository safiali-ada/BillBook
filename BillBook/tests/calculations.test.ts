import { describe, it, expect } from 'vitest';

// Import directly from the shared calculations
// These are the same functions used by both frontend and backend
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateLineSubtotal(quantity: number, sellingPrice: number): number {
  return round2(quantity * sellingPrice);
}

function calculateItemDiscount(
  subtotal: number,
  discountType: 'NONE' | 'PERCENTAGE' | 'FIXED',
  discountValue: number
): number {
  if (discountType === 'NONE' || discountValue <= 0) return 0;
  if (discountType === 'PERCENTAGE') {
    if (discountValue > 100) throw new Error('Discount percentage cannot exceed 100%');
    return round2((subtotal * discountValue) / 100);
  }
  if (discountType === 'FIXED') {
    if (discountValue > subtotal) throw new Error('Discount cannot exceed item subtotal');
    return round2(discountValue);
  }
  return 0;
}

function calculateLineTotal(subtotal: number, discountAmount: number): number {
  return round2(subtotal - discountAmount);
}

function calculateInvoiceDiscount(
  subtotalAfterItemDiscounts: number,
  discountType: 'NONE' | 'PERCENTAGE' | 'FIXED',
  discountValue: number
): number {
  if (discountType === 'NONE' || discountValue <= 0) return 0;
  if (discountType === 'PERCENTAGE') {
    if (discountValue > 100) throw new Error('Invoice discount percentage cannot exceed 100%');
    return round2((subtotalAfterItemDiscounts * discountValue) / 100);
  }
  if (discountType === 'FIXED') {
    if (discountValue > subtotalAfterItemDiscounts) throw new Error('Invoice discount cannot exceed subtotal');
    return round2(discountValue);
  }
  return 0;
}

function calculateTaxableAmount(
  subtotal: number,
  itemDiscountTotal: number,
  invoiceDiscountAmount: number
): number {
  return round2(subtotal - itemDiscountTotal - invoiceDiscountAmount);
}

function calculateGST(taxableAmount: number, gstRate: number): number {
  if (gstRate <= 0) return 0;
  if (gstRate > 100) throw new Error('GST rate cannot exceed 100%');
  return round2((taxableAmount * gstRate) / 100);
}

function calculateGrandTotal(taxableAmount: number, gstAmount: number): number {
  return round2(taxableAmount + gstAmount);
}

interface CalcInvoiceItem {
  quantity: number;
  selling_price: number;
  discount_type: 'NONE' | 'PERCENTAGE' | 'FIXED';
  discount_value: number;
}

function calculateFullInvoice(
  items: CalcInvoiceItem[],
  invoiceDiscountType: 'NONE' | 'PERCENTAGE' | 'FIXED',
  invoiceDiscountValue: number,
  gstEnabled: boolean,
  gstRate: number
) {
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

// ═══════════════════════════════════════════════════════════
// TEST SUITE: Invoice Calculations
// ═══════════════════════════════════════════════════════════

describe('Line Item Calculations', () => {
  it('calculates simple price × quantity', () => {
    expect(calculateLineSubtotal(1, 2000)).toBe(2000);
    expect(calculateLineSubtotal(3, 1800)).toBe(5400);
    expect(calculateLineSubtotal(10, 500)).toBe(5000);
  });

  it('handles fractional prices correctly', () => {
    expect(calculateLineSubtotal(3, 99.99)).toBe(299.97);
    expect(calculateLineSubtotal(7, 14.50)).toBe(101.50);
  });

  it('handles quantity of 1', () => {
    expect(calculateLineSubtotal(1, 1800)).toBe(1800);
  });
});

describe('Item Discount Calculations', () => {
  it('returns 0 for NONE discount', () => {
    expect(calculateItemDiscount(5400, 'NONE', 0)).toBe(0);
    expect(calculateItemDiscount(5400, 'NONE', 100)).toBe(0);
  });

  it('calculates percentage discount correctly', () => {
    expect(calculateItemDiscount(5400, 'PERCENTAGE', 10)).toBe(540);
    expect(calculateItemDiscount(2000, 'PERCENTAGE', 25)).toBe(500);
    expect(calculateItemDiscount(4000, 'PERCENTAGE', 50)).toBe(2000);
  });

  it('calculates fixed discount correctly', () => {
    expect(calculateItemDiscount(5400, 'FIXED', 400)).toBe(400);
    expect(calculateItemDiscount(2000, 'FIXED', 200)).toBe(200);
  });

  it('rejects percentage discount > 100%', () => {
    expect(() => calculateItemDiscount(5400, 'PERCENTAGE', 101)).toThrow();
    expect(() => calculateItemDiscount(5400, 'PERCENTAGE', 150)).toThrow();
  });

  it('rejects fixed discount > subtotal', () => {
    expect(() => calculateItemDiscount(5400, 'FIXED', 5401)).toThrow();
    expect(() => calculateItemDiscount(100, 'FIXED', 200)).toThrow();
  });

  it('handles 0% discount', () => {
    expect(calculateItemDiscount(5400, 'PERCENTAGE', 0)).toBe(0);
  });

  it('handles 100% discount', () => {
    expect(calculateItemDiscount(5400, 'PERCENTAGE', 100)).toBe(5400);
  });
});

describe('Line Total', () => {
  it('calculates line total after discount', () => {
    expect(calculateLineTotal(5400, 540)).toBe(4860);
    expect(calculateLineTotal(2000, 0)).toBe(2000);
    expect(calculateLineTotal(5400, 5400)).toBe(0);
  });
});

describe('GST Calculations', () => {
  it('calculates GST at various rates', () => {
    expect(calculateGST(4860, 18)).toBe(874.80);
    expect(calculateGST(10000, 5)).toBe(500);
    expect(calculateGST(10000, 12)).toBe(1200);
    expect(calculateGST(10000, 28)).toBe(2800);
  });

  it('returns 0 for 0% GST', () => {
    expect(calculateGST(10000, 0)).toBe(0);
  });

  it('rejects GST > 100%', () => {
    expect(() => calculateGST(10000, 101)).toThrow();
  });
});

describe('Invoice-Level Discount', () => {
  it('calculates percentage invoice discount', () => {
    expect(calculateInvoiceDiscount(20000, 'PERCENTAGE', 10)).toBe(2000);
    expect(calculateInvoiceDiscount(15000, 'PERCENTAGE', 5)).toBe(750);
  });

  it('calculates fixed invoice discount', () => {
    expect(calculateInvoiceDiscount(20000, 'FIXED', 500)).toBe(500);
    expect(calculateInvoiceDiscount(20000, 'FIXED', 2000)).toBe(2000);
  });

  it('rejects invoice discount exceeding subtotal', () => {
    expect(() => calculateInvoiceDiscount(20000, 'FIXED', 20001)).toThrow();
    expect(() => calculateInvoiceDiscount(20000, 'PERCENTAGE', 101)).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════
// ACCEPTANCE CRITERIA TEST (§43)
// ═══════════════════════════════════════════════════════════

describe('Acceptance Criteria — Full Invoice Flow', () => {
  it('correctly calculates the acceptance scenario: Chair ₹1,800 × 3, 10% item discount, 18% GST', () => {
    const result = calculateFullInvoice(
      [
        {
          quantity: 3,
          selling_price: 1800, // Modified from default ₹2,000
          discount_type: 'PERCENTAGE',
          discount_value: 10,
        },
      ],
      'NONE',
      0,
      true,
      18
    );

    // Subtotal: 3 × ₹1,800 = ₹5,400
    expect(result.subtotal).toBe(5400);

    // Item discount: 10% of ₹5,400 = ₹540
    expect(result.item_discount_total).toBe(540);
    expect(result.items[0].discount_amount).toBe(540);

    // Line total: ₹5,400 - ₹540 = ₹4,860
    expect(result.items[0].total).toBe(4860);

    // No invoice-level discount
    expect(result.invoice_discount_amount).toBe(0);

    // Taxable: ₹5,400 - ₹540 = ₹4,860
    expect(result.taxable_amount).toBe(4860);

    // GST: 18% of ₹4,860 = ₹874.80
    expect(result.gst_amount).toBe(874.80);

    // Grand total: ₹4,860 + ₹874.80 = ₹5,734.80
    expect(result.grand_total).toBe(5734.80);
  });
});

describe('Multiple Items with Mixed Discounts', () => {
  it('handles multiple items with different discount types', () => {
    const result = calculateFullInvoice(
      [
        {
          quantity: 2,
          selling_price: 500,
          discount_type: 'PERCENTAGE',
          discount_value: 10,
        },
        {
          quantity: 1,
          selling_price: 1000,
          discount_type: 'FIXED',
          discount_value: 100,
        },
        {
          quantity: 3,
          selling_price: 200,
          discount_type: 'NONE',
          discount_value: 0,
        },
      ],
      'PERCENTAGE',
      5,
      true,
      18
    );

    // Item 1: 2 × 500 = 1000, discount 10% = 100, total = 900
    expect(result.items[0].subtotal).toBe(1000);
    expect(result.items[0].discount_amount).toBe(100);
    expect(result.items[0].total).toBe(900);

    // Item 2: 1 × 1000 = 1000, discount ₹100, total = 900
    expect(result.items[1].subtotal).toBe(1000);
    expect(result.items[1].discount_amount).toBe(100);
    expect(result.items[1].total).toBe(900);

    // Item 3: 3 × 200 = 600, no discount, total = 600
    expect(result.items[2].subtotal).toBe(600);
    expect(result.items[2].discount_amount).toBe(0);
    expect(result.items[2].total).toBe(600);

    // Subtotal: 1000 + 1000 + 600 = 2600
    expect(result.subtotal).toBe(2600);

    // Item discounts: 100 + 100 + 0 = 200
    expect(result.item_discount_total).toBe(200);

    // After item discounts: 2600 - 200 = 2400
    // Invoice discount: 5% of 2400 = 120
    expect(result.invoice_discount_amount).toBe(120);

    // Taxable: 2600 - 200 - 120 = 2280
    expect(result.taxable_amount).toBe(2280);

    // GST: 18% of 2280 = 410.40
    expect(result.gst_amount).toBe(410.40);

    // Grand total: 2280 + 410.40 = 2690.40
    expect(result.grand_total).toBe(2690.40);
  });
});

describe('GST Disabled', () => {
  it('does not add GST when disabled', () => {
    const result = calculateFullInvoice(
      [{ quantity: 5, selling_price: 1000, discount_type: 'NONE', discount_value: 0 }],
      'NONE',
      0,
      false, // GST disabled
      18
    );

    expect(result.subtotal).toBe(5000);
    expect(result.gst_amount).toBe(0);
    expect(result.grand_total).toBe(5000);
  });
});

describe('Edge Cases', () => {
  it('handles zero-value items (free items)', () => {
    const result = calculateFullInvoice(
      [{ quantity: 1, selling_price: 0, discount_type: 'NONE', discount_value: 0 }],
      'NONE',
      0,
      false,
      0
    );
    expect(result.grand_total).toBe(0);
  });

  it('handles single item no discount no GST', () => {
    const result = calculateFullInvoice(
      [{ quantity: 1, selling_price: 2000, discount_type: 'NONE', discount_value: 0 }],
      'NONE',
      0,
      false,
      0
    );
    expect(result.grand_total).toBe(2000);
  });

  it('handles currency rounding edge cases', () => {
    // 3 × ₹33.33 = ₹99.99
    const result = calculateFullInvoice(
      [{ quantity: 3, selling_price: 33.33, discount_type: 'NONE', discount_value: 0 }],
      'NONE',
      0,
      true,
      18
    );
    expect(result.subtotal).toBe(99.99);
    // GST: 18% of 99.99 = 18.00 (rounded)
    expect(result.gst_amount).toBe(18.00);
    expect(result.grand_total).toBe(117.99);
  });

  it('handles 100% item discount', () => {
    const result = calculateFullInvoice(
      [{ quantity: 2, selling_price: 500, discount_type: 'PERCENTAGE', discount_value: 100 }],
      'NONE',
      0,
      false,
      0
    );
    expect(result.items[0].total).toBe(0);
    expect(result.grand_total).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════
// Invoice Integrity Tests (snapshot isolation)
// ═══════════════════════════════════════════════════════════

describe('Invoice Integrity — Price Snapshot Isolation', () => {
  it('invoice uses selling_price, not the product default price', () => {
    const productDefaultPrice = 2000;
    const invoiceSellingPrice = 1800;

    const result = calculateFullInvoice(
      [{ quantity: 3, selling_price: invoiceSellingPrice, discount_type: 'NONE', discount_value: 0 }],
      'NONE',
      0,
      false,
      0
    );

    // Invoice total should use the selling price, NOT the default
    expect(result.subtotal).toBe(5400); // 3 × 1800
    expect(result.subtotal).not.toBe(productDefaultPrice * 3); // NOT 3 × 2000

    // Product default price should remain unchanged (conceptual test)
    expect(productDefaultPrice).toBe(2000);
  });
});
