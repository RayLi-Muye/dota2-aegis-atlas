import { DotaDashboard } from "@/components/dota/DotaDashboard";
import { getDotaOverview } from "@/lib/dota/opendota";

export const dynamic = "force-dynamic";

export default async function Home() {
  const overview = await getDotaOverview();
  return <DotaDashboard initialData={overview} />;
}
