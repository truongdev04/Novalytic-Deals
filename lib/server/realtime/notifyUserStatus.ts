import { createClient } from "@supabase/supabase-js";

// Push signal for AccountStatusWatcher, replacing its old 20s client poll.
// updateUserStatus()/deleteUser() call this right after purgeTag, so an open
// admin tab hears about its own deactivation over a WebSocket on Supabase's
// infrastructure — no Vercel function invocation, no ISR Write.
//
// The payload is empty on purpose: it's only a nudge for the client to
// re-hit /api/admin/session/status, which stays the single source of truth
// (reads the real status from the DB). A dropped signal is not a security
// hole — the watcher re-checks on mount, on every (re)subscribe, on tab
// focus, and on a slow safety-net interval.
//
// Broadcast on a channel named per user id needs no RLS: the app uses
// NextAuth JWTs, not Supabase Auth, so postgres_changes on `users` would
// have no auth.uid() to scope by. Sent with the service_role key (server
// only, trusted).

function getClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function notifyUserStatusChanged(userId: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    const channel = client.channel(`user-status:${userId}`);
    // Not subscribed — supabase-js sends this over the HTTP broadcast
    // endpoint, so there's no socket to open or tear down here.
    await channel.send({ type: "broadcast", event: "changed", payload: {} });
    await client.removeChannel(channel);
  } catch {
    // Best-effort. Never fail the user mutation because the nudge didn't send.
  }
}
