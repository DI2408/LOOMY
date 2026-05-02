import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderManagerRow, OrderManagerStatus } from "./orderManagerTypes";
import { OrderTransitionError } from "./orderManagerTypes";

function parseStatus(value: unknown): OrderManagerStatus | null {
  if (
    value === "pending_payment" ||
    value === "paid" ||
    value === "ready_for_pickup" ||
    value === "delivered"
  ) {
    return value;
  }
  return null;
}

export type OrderManagerRepository = {
  getById(orderId: string): Promise<OrderManagerRow | null>;
  insertPending(orderId: string): Promise<OrderManagerRow>;
  updateStatus(
    orderId: string,
    next: OrderManagerStatus,
    /** If set, update only when current row matches (optimistic concurrency). */
    ifCurrentStatus?: OrderManagerStatus
  ): Promise<OrderManagerRow>;
};

const TABLE = "loomy_orders";

export function createSupabaseOrderManagerRepository(
  supabase: SupabaseClient
): OrderManagerRepository {
  return {
    async getById(orderId: string): Promise<OrderManagerRow | null> {
      const { data, error } = await supabase
        .from(TABLE)
        .select("id, status, updated_at")
        .eq("id", orderId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      const status = parseStatus(data.status);
      if (!status) return null;
      return {
        id: data.id as string,
        status,
        updatedAt: data.updated_at as string,
      };
    },

    async insertPending(orderId: string): Promise<OrderManagerRow> {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({ id: orderId, status: "pending_payment" })
        .select("id, status, updated_at")
        .single();

      if (error) throw error;
      return {
        id: data.id as string,
        status: "pending_payment",
        updatedAt: data.updated_at as string,
      };
    },

    async updateStatus(
      orderId: string,
      next: OrderManagerStatus,
      ifCurrentStatus?: OrderManagerStatus
    ): Promise<OrderManagerRow> {
      let query = supabase
        .from(TABLE)
        .update({ status: next, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (ifCurrentStatus !== undefined) {
        query = query.eq("status", ifCurrentStatus);
      }

      const { data, error } = await query
        .select("id, status, updated_at")
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        const current = await this.getById(orderId);
        throw new OrderTransitionError(
          ifCurrentStatus
            ? `Ordre ${orderId} blev ikke opdateret (forventet status "${ifCurrentStatus}").`
            : `Ordre ${orderId} findes ikke.`,
          orderId,
          current?.status ?? null,
          next
        );
      }

      const status = parseStatus(data.status);
      if (!status) {
        throw new OrderTransitionError(
          "Ugyldig status i database.",
          orderId,
          null,
          next
        );
      }

      return {
        id: data.id as string,
        status,
        updatedAt: data.updated_at as string,
      };
    },
  };
}
