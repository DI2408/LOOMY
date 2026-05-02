export const CART_STORAGE_KEY = "loomy-cart-v1";

export type PersistedCartLine = {
  id: string;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  size: "XS" | "S" | "M" | "L";
  qty: number;
  unitPriceKr: number;
  imageUrl: string;
};

export function loadCartFromStorage(): PersistedCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is PersistedCartLine =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as PersistedCartLine).id === "string" &&
        typeof (row as PersistedCartLine).storeId === "string",
    );
  } catch {
    return [];
  }
}

export function saveCartToStorage(lines: PersistedCartLine[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // ignore quota
  }
}
