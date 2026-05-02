export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }
  try {
    const { getStoreNotificationService } = await import(
      "@/server/store/storeNotificationSingleton"
    );
    getStoreNotificationService().listen();
  } catch (err) {
    console.warn(
      "[loomy] StoreNotificationService not started (check Supabase service env).",
      err
    );
  }
}
