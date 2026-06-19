import type { BuildLookupBoundary, BuildLookupBoundaryMap, BuildLookupDomain } from "./types";

export const buildLookupBoundaries = {
  items: {
    domain: "items",
    label: "Items",
    publicDataToday: [
      "OpenDota /constants/items static item names, image paths, and costs.",
      "OpenDota /heroes/{heroId}/itemPopularity phase buckets for public hero item timing.",
    ],
    currentProductUse:
      "Hero detail and overview responses normalize public item popularity into staged item timing summaries.",
    fallbackPolicy:
      "Bundled item examples support local demos and provider outage resilience; they are not current-match or current-patch truth.",
    credentialedProviderNeededFor: [
      "Patch/rank/role-filtered item trends beyond the public itemPopularity buckets.",
      "Personalized build recommendations based on private or account-linked match history.",
    ],
    explicitNonGoals: [
      "No paid OpenDota plan assumptions.",
      "No private player inventory, account, or purchase history.",
    ],
  },
  abilities: {
    domain: "abilities",
    label: "Abilities",
    publicDataToday: [
      "OpenDota /constants/abilities static ability metadata can be used for name/icon lookup once wired.",
    ],
    currentProductUse:
      "Ability lookup is not surfaced yet. The approved boundary covers static public metadata, not hero-specific skill-order analytics.",
    fallbackPolicy:
      "Fallback ability metadata may be used for UI resilience only and must be labeled as sample data.",
    credentialedProviderNeededFor: [
      "Hero-specific skill build timelines.",
      "Ability pick, win, or order distributions by patch, bracket, lane, or role.",
    ],
    explicitNonGoals: [
      "No Steam Web API connection for this boundary work.",
      "No STRATZ GraphQL token use for this boundary work.",
    ],
  },
  talents: {
    domain: "talents",
    label: "Talents",
    publicDataToday: [
      "Static talent labels may be represented as ability metadata when available in public constants.",
    ],
    currentProductUse:
      "Talent lookup is not surfaced yet. Aegis Atlas does not claim public talent pick or win distribution support today.",
    fallbackPolicy:
      "Fallback talent examples may support local design demos only and must not be treated as meta truth.",
    credentialedProviderNeededFor: [
      "Talent pick and win distributions.",
      "Patch-specific talent comparisons and bracket-filtered talent analysis.",
    ],
    explicitNonGoals: [
      "No credentialed provider calls.",
      "No paid API access.",
      "No production data storage for talent analytics.",
    ],
  },
} satisfies BuildLookupBoundaryMap;

export function listBuildLookupBoundaries(): BuildLookupBoundary[] {
  return Object.values(buildLookupBoundaries);
}

export function getBuildLookupBoundary(domain: BuildLookupDomain): BuildLookupBoundary {
  return buildLookupBoundaries[domain];
}

export function requiresCredentialedProviderForDistribution(domain: BuildLookupDomain): boolean {
  return getBuildLookupBoundary(domain).credentialedProviderNeededFor.length > 0;
}
