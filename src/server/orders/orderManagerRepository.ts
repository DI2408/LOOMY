import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoreOrderDetailsJson } from "@/server/events/orderPaidEvents";
import type {
  OrderManagerRow,
  OrderManagerStatus,
  RegisterPendingOrderInput,
} from "./orderManagerTypes";
import { OrderTransitionError } from "./orderManagerTypes";

function parseStatus(value: unknown): OrderManagerStatus | null {
  if (
    value === "pending_payment" ||
    value === "paid" ||
    value === "ready_for_pickup" ||
    value === "dispatched" ||
    value === "out_for_delivery" ||
    value === "delivered"
  ) {
    return value;
  }
  return null;
}

function rowFromDb(data: Record<string, unknown>): OrderManagerRow | null {
  const status = parseStatus(data.status);
  if (!status) return null;
  const details = data.order_details;
  const orderDetails: StoreOrderDetailsJson =
    details && typeof details === "object" && !Array.isArray(details)
      ? (details as StoreOrderDetailsJson)
      : {};
  const courierRaw = data.courier_id;
  const courierId =
    typeof courierRaw === "string" && courierRaw.length > 0 ? courierRaw : null;

  return {
    id: data.id as string,
    storeId: (data.store_id as string) ?? "",
    courierId,
    status,
    orderDetails,
    offlinePushQueued: Boolean(data.offline_push_queued),
    updatedAt: data.updated_at as string,
  };
}

export type OrderManagerRepository = {
  getById(orderId: string): Promise<OrderManagerRow | null>;
  insertPending(input: RegisterPendingOrderInput): Promise<OrderManagerRow>;
  updateStatus(
    orderId: string,
    next: OrderManagerStatus,
    ifCurrentStatus?: OrderManagerStatus
  ): Promise<OrderManagerRow>;
  listPaidByStore(storeId: string): Promise<OrderManagerRow[]>;
  setOfflinePushQueued(orderId: string, queued: boolean): Promise<void>;
  claimOrderForCourier(
    orderId: string,
    courierId: string
  ): Promise<OrderManagerRow | null>;
  listOutForDeliveryByCourier(courierId: string): Promise<OrderManagerRow[]>;
};

const TABLE = "loomy_orders";

export function createSupabaseOrderManagerRepository(
  supabase: SupabaseClient
): OrderManagerRepository {
  return {
    async getById(orderId: string): Promise<OrderManagerRow | null> {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          "id, store_id, courier_id, status, order_details, offline_push_queued, updated_at"
        )
        .eq("id", orderId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return rowFromDb(data as Record<string, unknown>);
    },

    async insertPending(
      input: RegisterPendingOrderInput
    ): Promise<OrderManagerRow> {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          id: input.orderId,
          store_id: input.storeId,
          status: "pending_payment",
          order_details: input.orderDetails ?? {},
        })
        .select(
          "id, store_id, courier_id, status, order_details, offline_push_queued, updated_at"
        )
        .single();

      if (error) throw error;
      const row = rowFromDb(data as Record<string, unknown>);
      if (!row) throw new Error("Invalid row after insert");
      return row;
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
        .select(
          "id, store_id, courier_id, status, order_details, offline_push_queued, updated_at"
        )
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

      const row = rowFromDb(data as Record<string, unknown>);
      if (!row) {
        throw new OrderTransitionError(
          "Ugyldig status i database.",
          orderId,
          null,
          next
        );
      }

      return row;
    },

    async listPaidByStore(storeId: string): Promise<OrderManagerRow[]> {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          "id, store_id, courier_id, status, order_details, offline_push_queued, updated_at"
        )
        .eq("store_id", storeId)
        .eq("status", "paid")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      const rows: OrderManagerRow[] = [];
      for (const raw of data ?? []) {
        const r = rowFromDb(raw as Record<string, unknown>);
        if (r) rows.push(r);
      }
      return rows;
    },

    async setOfflinePushQueued(orderId: string, queued: boolean): Promise<void> {
      const { error } = await supabase
        .from(TABLE)
        .update({
          offline_push_queued: queued,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;
    },

    async claimOrderForCourier(
      orderId: string,
      courierId: string
    ): Promise<OrderManagerRow | null> {
      const { data, error } = await supabase
        .from(TABLE)
        .update({
          courier_id: courierId,
          status: "dispatched",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("status", "ready_for_pickup")
        .is("courier_id", null)
        .select(
          "id, store_id, courier_id, status, order_details, offline_push_queued, updated_at"
        )
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return rowFromDb(data as Record<string, unknown>);
    },

    async listOutForDeliveryByCourier(
      courierId: string
    ): Promise<OrderManagerRow[]> {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          "id, store_id, courier_id, status, order_details, offline_push_queued, updated_at"
        )
        .eq("courier_id", courierId)
        .eq("status", "out_for_delivery");

      if (error) throw error;
      const rows: OrderManagerRow[] = [];
      for (const raw of data ?? []) {
        const r = rowFromDb(raw as Record<string, unknown>);
        if (r) rows.push(r);
      }
      return rows;
    },
  };
}
