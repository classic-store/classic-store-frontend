export type ProductStatus = "Online" | "Offline";
export type Availability = "Available" | "Unavailable";
export type OrderStatus = "pending" | "processing" | "partially_delivered" | "completed" | "cancelled" | "refunded" | "invalid";

export interface Product {
  id: string;
  productCode?: string;
  name: string;
  status: ProductStatus;
  availability: Availability;
  stockLimit: number;
  stockQuantity?: number;
  reservedQuantity?: number;
  pricePerMillion: number;
  minCoins: number;
  maxCoins: number;
  currency?: string;
}

export interface Order {
  id: string;
  externalOrderId?: string;
  dateTime: string;
  platform: string;
  quantity: number;
  delivered: number;
  earning: number;
  status: OrderStatus;
  trackId: string;
  customerEmail?: string;
  failureCode?: string | null;
  failureMessage?: string | null;
  credentials?: {
    username: string;
    password: string;
    backupCodes?: string[];
  };
}

export interface FinancialSummary {
  totalEarned: number;
  paidOut: number;
  availableBalance: number;
  currency?: string;
}

export interface PayoutRecord { id: string; date: string; amount: number; reference?: string; note?: string; }


export interface OrderTrackingTrade {
  rowNumber: number;
  purchase: number | null;
  sale: number | null;
  net: number;
}

export interface OrderTrackingDetails {
  orderId: string;
  currentCoinsBalance: number | null;
  beforeImageData: string | null;
  afterImageData: string | null;
  trades: OrderTrackingTrade[];
}

export interface AdminUser {
  id: string;
  email: string;
  role: "ADMIN" | "VIEWER";
  active: boolean;
  createdAt: string;
}
