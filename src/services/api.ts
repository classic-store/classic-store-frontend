import type { AdminUser, FinancialSummary, Order, OrderStatus, OrderTrackingDetails, Product, PayoutRecord } from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export type AuthResponse = {
  accessToken?: string;
  access_token?: string;
  token?: string;
  authenticated?: boolean;
  success?: boolean;
  message?: string;
  user?: { id: string; email: string; role: string };
};
export type LoginRequest = { email: string; password: string; rememberMe?: boolean };

type ApiProduct = Product;
function productPayload(product: Product) {
  return {
    productCode: product.productCode,
    name: product.name,
    stockLimit: product.stockLimit,
    minCoins: product.minCoins,
    maxCoins: product.maxCoins,
    pricePerMillion: product.pricePerMillion,
    currency: product.currency ?? "USD",
    status: product.status,
  };
}
type ApiOrder = {
  id: string; externalOrderId: string; dateTime: string; platform: string; quantity: number; delivered: number;
  earning: number; status: string; trackId: string; customerEmail?: string;
  failureCode?: string | null; failureMessage?: string | null; merchantName?: string;
};

function getAuthToken(): string | null {
  return localStorage.getItem("classic_store_auth_token") ?? sessionStorage.getItem("classic_store_auth_token");
}
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken(); return token ? { Authorization: `Bearer ${token}` } : {};
}
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include", ...options,
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...(options.headers ?? {}) },
  });
  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try { const payload = await response.json() as { message?: string }; if (payload.message) message = payload.message; } catch { /* response may be empty */ }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
function mapOrder(order: ApiOrder): Order {
  return { ...order, id: order.id, externalOrderId: order.externalOrderId, status: order.status as OrderStatus };
}

export const api = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });
    const rawBody = await response.text(); let payload: AuthResponse = {};
    if (rawBody) { try { payload = JSON.parse(rawBody) as AuthResponse; } catch { payload = { message: rawBody }; } }
    if (!response.ok) throw new Error(payload.message || (response.status === 401 ? "Invalid email or password." : `Sign-in failed (${response.status}).`));
    return payload;
  },
  changePassword: (currentPassword: string, newPassword: string) => request<{ message: string }>("/api/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }),
  getCurrentUser: () => request<{ id: string; email: string; role: string }>("/api/auth/me"),
  getUsers: () => request<AdminUser[]>("/api/admin/users"),
  createUser: (email: string, password: string, role: "ADMIN" | "VIEWER") => request<AdminUser>("/api/admin/users", { method: "POST", body: JSON.stringify({ email, password, role }) }),
  setUserActive: (id: string, active: boolean) => request<AdminUser>(`/api/admin/users/${id}/active`, { method: "PATCH", body: JSON.stringify({ active }) }),
  deleteUser: (id: string) => request<void>(`/api/admin/users/${id}`, { method: "DELETE" }),
  getProducts: async () => (await request<ApiProduct[]>("/api/products")).map(p => ({ ...p, id: String(p.id) })),
  createProduct: async (product: Product) => {
    const saved = await request<Product>("/api/products", { method: "POST", body: JSON.stringify(productPayload(product)) });
    return { ...saved, id: String(saved.id) };
  },
  getOrders: async () => (await request<ApiOrder[]>("/api/orders")).map(mapOrder),
  getFinancialSummary: () => request<FinancialSummary>("/api/financial-summary"),
  getPayouts: () => request<PayoutRecord[]>("/api/payouts"),
  createPayout: (payout: Omit<PayoutRecord, "id">) => request<PayoutRecord>("/api/payouts", { method: "POST", body: JSON.stringify(payout) }),
  deletePayout: (id: string) => request<void>(`/api/payouts/${id}`, { method: "DELETE" }),
  updateProduct: (product: Product) => request<Product>(`/api/products/${product.id}`, { method: "PUT", body: JSON.stringify(productPayload(product)) }),
  revealCredentials: (orderId: string) => request<Order["credentials"]>(`/api/orders/${orderId}/credentials`),
  updateOrderStatus: (orderId: string, status: string, deliveredQuantity?: number, failureCode?: string | null) =>
    request<ApiOrder>(`/api/orders/${orderId}/status`, {
      method: "PATCH", body: JSON.stringify({ status, deliveredQuantity, failureCode }),
    }).then(mapOrder),
  getOrderTracking: (orderId: string) => request<OrderTrackingDetails>(`/api/orders/${orderId}/tracking`),
  saveOrderTracking: (orderId: string, details: Omit<OrderTrackingDetails, "orderId" | "trades"> & { trades: Array<Omit<OrderTrackingDetails["trades"][number], "net">> }) =>
    request<OrderTrackingDetails>(`/api/orders/${orderId}/tracking`, { method: "PUT", body: JSON.stringify(details) }),
  sendTelegramTest: () => request<void>("/api/integrations/telegram/test", { method: "POST" }),
  connectTelegram: () => request<void>("/api/integrations/telegram", { method: "POST" }),
  disconnectTelegram: () => request<void>("/api/integrations/telegram", { method: "DELETE" }),
  getMerchants: () => request<Array<{ id: string; name: string; contactEmail?: string; active: boolean; apiKeyLast4: string; createdAt: string }>>("/api/merchants"),
  createMerchant: (name: string, contactEmail?: string) => request<{ id: string; name: string; contactEmail?: string; active: boolean; apiKeyLast4: string; createdAt: string; apiKey: string }>("/api/merchants", { method: "POST", body: JSON.stringify({ name, contactEmail }) }),
  rotateMerchantKey: (id: string) => request<{ id: string; name: string; contactEmail?: string; active: boolean; apiKeyLast4: string; createdAt: string; apiKey: string }>(`/api/merchants/${id}/rotate-key`, { method: "POST" }),
  setMerchantActive: (id: string, active: boolean) => request<{ id: string; name: string; contactEmail?: string; active: boolean; apiKeyLast4: string; createdAt: string }>(`/api/merchants/${id}/active`, { method: "PATCH", body: JSON.stringify({ active }) }),
};

export function setAuthToken(token: string, rememberMe = true): void { clearAuthToken(); (rememberMe ? localStorage : sessionStorage).setItem("classic_store_auth_token", token); }
export function setAuthSession(rememberMe = true): void { clearAuthToken(); (rememberMe ? localStorage : sessionStorage).setItem("classic_store_authenticated", "true"); }
export function clearAuthToken(): void {
  localStorage.removeItem("classic_store_auth_token"); sessionStorage.removeItem("classic_store_auth_token");
  localStorage.removeItem("classic_store_authenticated"); sessionStorage.removeItem("classic_store_authenticated");
}
export function hasAuthSession(): boolean { return Boolean(getAuthToken() || localStorage.getItem("classic_store_authenticated") || sessionStorage.getItem("classic_store_authenticated")); }
