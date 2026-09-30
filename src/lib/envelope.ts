// envelope.ts — structured API response shape.
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export function ok<T>(data: T, meta: Record<string, unknown> = {}) {
  return NextResponse.json({
    ok: true,
    data,
    meta: { ts: new Date().toISOString(), requestId: randomUUID(), ...meta },
  });
}

export function err(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message, details },
      meta: { ts: new Date().toISOString(), requestId: randomUUID() },
    },
    { status },
  );
}
