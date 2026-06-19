import { DotaDashboard } from "@/components/dota/DotaDashboard";
import { listBuildLookupBoundaries } from "@/lib/dota/lookup-boundaries";
import { getDotaOverview } from "@/lib/dota/opendota";

export const dynamic = "force-dynamic";

export default async function Home() {
  const overview = await getDotaOverview();
  const lookupBoundaries = listBuildLookupBoundaries();

  return <DotaDashboard initialData={overview} lookupBoundaries={lookupBoundaries} />;
}
