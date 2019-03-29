export interface IAmazonObject {
  productUrl: string;
  title: string;
  asin: string;
  merchantId: string;
  isAvailable: boolean;
  price: number | null;
  inventorySize?: number;
  salesRank: object;
}
