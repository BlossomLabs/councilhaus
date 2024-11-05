export const SITE_NAME = "CouncilHaus";
export const SITE_DESCRIPTION =
  "Democratically allocate a budget across projects";
export const SITE_URL = import.meta.env.VITE_SITE_URL || "https://council.haus";
export const SOCIAL_TWITTER = "blossom_labs";
export const SOCIAL_GITHUB = "BlossomLabs/CouncilHaus";

export const DEFAULT_COUNCIL_ADDRESS =
  "0xfa942226e5dd1e2d4d99014982846786b09939da";
export const COUNCIL_FACTORY_ADDRESS =
  "0xdef306E171B39101cf133747f391E5e1A49C8948"; // Update also in contracts/councilhaus/subgraph/config/*.json
export const NETWORK: "optimism" | "base" = "base";
