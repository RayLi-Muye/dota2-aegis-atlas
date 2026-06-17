import { getDotaOverview } from "@/lib/dota/opendota";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const overview = await getDotaOverview();
  return Response.json(overview, {
    headers: {
      "cache-control": "public, s-maxage=300, stale-while-revalidate=1800",
    },
  });
}
