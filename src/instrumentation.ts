export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }
  try {
    const { getCourierDispatchSystem } = await import(
      "@/server/courier/courierDispatchSingleton"
    );
    getCourierDispatchSystem().listen();
  } catch (err) {
    console.warn(
      "[loomy] CourierDispatchSystem not started (check Supabase service env).",
      err
    );
  }
}
