import type { CartLine, CartState, InventoryLine } from "./types";

export type AddToCartResult =
  | { ok: true; cart: CartState }
  | { ok: false; reason: string };

/**
 * In-memory cart for the customer agent. Stock is checked against the
 * latest inventory snapshot passed into `add`.
 */
export class CustomerCart {
  private state: CartState | null = null;

  getState(): CartState | null {
    return this.state;
  }

  bindStore(storeId: string): void {
    if (this.state?.storeId !== storeId) {
      this.state = { storeId, lines: [] };
    }
  }

  clear(): void {
    if (this.state) {
      this.state = { storeId: this.state.storeId, lines: [] };
    }
  }

  /**
   * Verifies `stock_status` via numeric availability on each add.
   */
  add(
    productId: string,
    quantity: number,
    inventory: readonly InventoryLine[]
  ): AddToCartResult {
    if (!this.state) {
      return { ok: false, reason: "Ingen butik valgt." };
    }
    if (quantity <= 0 || !Number.isFinite(quantity)) {
      return { ok: false, reason: "Ugyldigt antal." };
    }

    const row = inventory.find((i) => i.productId === productId);
    if (!row) {
      return { ok: false, reason: "Produktet findes ikke i denne butik." };
    }
    if (row.quantityAvailable <= 0) {
      return { ok: false, reason: "Varen er udsolgt." };
    }

    const existing = this.state.lines.find((l) => l.productId === productId);
    const nextQty = (existing?.quantity ?? 0) + quantity;
    if (nextQty > row.quantityAvailable) {
      return {
        ok: false,
        reason: `Ikke nok på lager (tilgængelig: ${row.quantityAvailable}).`,
      };
    }

    const lines: CartLine[] = this.state.lines.filter(
      (l) => l.productId !== productId
    );
    lines.push({
      productId: row.productId,
      sku: row.sku,
      name: row.name,
      quantity: nextQty,
      unitPriceMinorUnits: row.priceMinorUnits,
    });

    this.state = { storeId: this.state.storeId, lines };
    return { ok: true, cart: this.state };
  }

  remove(productId: string): void {
    if (!this.state) return;
    this.state = {
      storeId: this.state.storeId,
      lines: this.state.lines.filter((l) => l.productId !== productId),
    };
  }

  /** Re-validate every line against current inventory (e.g. before checkout). */
  validateAgainstInventory(
    inventory: readonly InventoryLine[]
  ): { ok: true } | { ok: false; reason: string } {
    if (!this.state || this.state.lines.length === 0) {
      return { ok: false, reason: "Kurven er tom." };
    }
    for (const line of this.state.lines) {
      const row = inventory.find((i) => i.productId === line.productId);
      if (!row) {
        return {
          ok: false,
          reason: `Produkt ${line.name} findes ikke længere.`,
        };
      }
      if (line.quantity > row.quantityAvailable) {
        return {
          ok: false,
          reason: `Opdateret lager for "${line.name}": max ${row.quantityAvailable}.`,
        };
      }
    }
    return { ok: true };
  }
}
