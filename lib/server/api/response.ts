import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
