"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { ShieldAlert } from "lucide-react";

const POLL_INTERVAL_MS = 20_000;
const AUTO_LOGOUT_AFTER_MS = 8_000;

// Sessions are JWT-based, so a role/status change doesn't invalidate an
// already-open session. This polls the current user's own status and,
// the moment it's deactivated or the account is deleted, blocks the UI
// with a non-dismissable dialog and forces a sign-out.
export function AccountStatusWatcher() {
  const [deactivated, setDeactivated] = useState(false);
  const checkingRef = useRef(false);
  // Guards against the auto-logout timer and a manual button click both
  // firing signOut() around the same moment — next-auth's signOut() isn't
  // idempotent-safe to call twice in quick succession (two in-flight CSRF
  // fetches can race), so only the first call is allowed through.
  const signingOutRef = useRef(false);

  function handleSignOut() {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    signOut({ callbackUrl: "/admin/login" }).catch(() => {
      // The next-auth client helper failed (network hiccup, etc.) — fall
      // back to a plain hard navigation so the user is never stuck behind
      // this dialog with no way out.
      window.location.href = "/admin/login";
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        const res = await fetch("/api/admin/session/status", { cache: "no-store" });
        if (res.status === 401) {
          if (!cancelled) setDeactivated(true);
          return;
        }
        if (!res.ok) return;
        const body = await res.json().catch(() => null);
        if (!cancelled && body?.data?.active === false) {
          setDeactivated(true);
        }
      } catch {
        // Transient network error — don't false-trigger, next poll will retry.
      } finally {
        checkingRef.current = false;
      }
    }

    check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  useEffect(() => {
    if (!deactivated) return;
    const timeout = setTimeout(handleSignOut, AUTO_LOGOUT_AFTER_MS);
    return () => clearTimeout(timeout);
  }, [deactivated]);

  if (!deactivated) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-950/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-surface-0 p-6 text-center shadow-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-heading text-lg font-semibold text-brand-950">
          Tài khoản không còn hoạt động
        </h2>
        <p className="mt-2 text-sm text-muted-600">
          Tài khoản của bạn đã bị vô hiệu hóa hoặc xóa khỏi hệ thống. Vui lòng đăng xuất khỏi
          trang quản trị.
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Đăng xuất ngay
        </button>
      </div>
    </div>
  );
}
