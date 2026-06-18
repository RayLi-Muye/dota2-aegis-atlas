import { getHeroDetail } from "@/lib/dota/opendota";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ heroId: string }> },
) {
  const { heroId } = await params;
  const detail = await getHeroDetail(heroId);
  return Response.json(detail, {
    headers: {
      "cache-control": "public, s-maxage=300, stale-while-revalidate=1800",
    },
  });
}
