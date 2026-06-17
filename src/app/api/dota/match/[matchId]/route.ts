import { getMatchReplay } from "@/lib/dota/opendota";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;
  const replay = await getMatchReplay(matchId);
  return Response.json(replay, {
    headers: {
      "cache-control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
