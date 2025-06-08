
export interface ProductQRCodeData {
  productImageBase64: string | null;
  productName?: string; // Optional: Decided to keep it simple and not add UI for this.
  totalPriceUSD: number;
  usdtAmountUSD: number;
  ivyAmountUSD: number; // Changed from trxAmountUSD
}