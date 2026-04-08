export type ProductInputValidation = {
  valid: boolean;
  message?: string;
  price?: number;
  stock?: number;
};

/* Normalizes an optional text value by trimming whitespace and returning null if empty */
export function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/* Validates an optional image URL */
export function validateOptionalImageUrl(value: string): { valid: boolean; message?: string; normalized?: string | null } {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return { valid: true, normalized: null };
  }

  const valid = normalized.startsWith("http://") || normalized.startsWith("https://");
  if (!valid) {
    return { valid: false, message: "Image URL must start with http:// or https://" };
  }

  return { valid: true, normalized };
}

/* Validates product input values */
export function validateProductInputs(priceText: string, stockText: string): ProductInputValidation {
  const price = Number(priceText);
  const stock = Number(stockText);

  if (!Number.isFinite(price) || !Number.isFinite(stock)) {
    return { valid: false, message: "Price and stock must be valid numbers" };
  }

  if (price < 0 || stock < 0) {
    return { valid: false, message: "Price and stock cannot be negative" };
  }

  return { valid: true, price, stock };
}

/* Checks if the order quantity is invalid based on the maximum available stock */
export function isInvalidOrderQuantity(quantityText: string, maxStock: number): boolean {
  const quantity = Number(quantityText || 0);
  return !Number.isFinite(quantity) || quantity <= 0 || quantity > maxStock;
}
