export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }
  try {
    const { registerAllLoomyAgents } = await import("@/services/orchestrationAgent");
    registerAllLoomyAgents();
  } catch (err) {
    console.warn(
      "[LOOMY] agent orchestration not started (check Supabase / env).",
      err
    );
  }
}
