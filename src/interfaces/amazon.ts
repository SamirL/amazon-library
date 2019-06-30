export interface IAmazonObject {
  productUrl: string;
  title: string;
  asin: string;
  category: string;
  merchantId: string;
  merchantName: string;
  isAvailable: boolean;
  price: number | null;
  inventorySize?: number;
  salesRank: object;
}
