import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const {
      rows: [row],
    } = await pool.query(
      "SELECT count(*)::int AS total,count(DISTINCT rarity) FILTER (WHERE active)::int AS rarities FROM definitions",
    );
    const ready = row.total >= 36 && row.rarities === 4;
    return NextResponse.json(
      { status: ready ? "ok" : "catalogue-incomplet" },
      { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "base-indisponible" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
