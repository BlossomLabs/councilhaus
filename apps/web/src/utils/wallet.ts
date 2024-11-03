"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createPublicClient } from "viem";
import { http, createConfig } from "wagmi";
import { base, mainnet, optimism } from "wagmi/chains";
import { SITE_NAME } from "../../../../constants";

import { NETWORK } from "../../../../constants";
const chain = NETWORK === "optimism" ? optimism : base;

export const WALLETCONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "";
if (!WALLETCONNECT_PROJECT_ID) {
  console.warn(
    "You need to provide a VITE_WALLETCONNECT_PROJECT_ID env variable",
  );
}

type RainbowKitConfig = ReturnType<typeof getDefaultConfig>;

export const WALLETCONNECT_CONFIG: RainbowKitConfig = getDefaultConfig({
  appName: SITE_NAME,
  projectId: WALLETCONNECT_PROJECT_ID || "dummy",
  chains: [chain],
  ssr: false,
});

export const mainnetConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
}); // Use this to get ENS addresses
