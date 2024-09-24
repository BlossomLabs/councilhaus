"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createPublicClient } from "viem";
import { http, createConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { SITE_NAME } from "../../../../constants";

import * as chains from "wagmi/chains";
import { NETWORK } from "../../../../constants";
const chain = chains[NETWORK];

export const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
if (!WALLETCONNECT_PROJECT_ID) {
  console.warn(
    "You need to provide a NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID env variable",
  );
}

type RainbowKitConfig = ReturnType<typeof getDefaultConfig>;

export const WALLETCONNECT_CONFIG: RainbowKitConfig = getDefaultConfig({
  appName: SITE_NAME,
  projectId: WALLETCONNECT_PROJECT_ID || "dummy",
  chains: [chain],
  ssr: true,
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
