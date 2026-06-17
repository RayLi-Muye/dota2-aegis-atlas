import { getPlayerProfile } from "@/lib/dota/opendota";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await params;
  const player = await getPlayerProfile(accountId);
  return Response.json(player, {
    headers: {
      "cache-control": "public, s-maxage=180, stale-while-revalidate=1200",
    },
  });
}
