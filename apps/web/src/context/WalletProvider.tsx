"use client";

import {
  type AvatarComponent,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import colors from "tailwindcss/colors";
import { type State, WagmiProvider } from "wagmi";
import AddressAvatar from "../components/AddressAvatar";
import { WALLETCONNECT_CONFIG } from "../utils/wallet";

interface Props extends PropsWithChildren {
  initialState?: State;
}

const queryClient = new QueryClient();

const CustomAvatar: AvatarComponent = ({
  address,
  size,
}: { address: string; size: number }) => {
  return <AddressAvatar addressOrEns={address} size={size} />;
};

export function WalletProvider(props: Props) {
  return (
    <WagmiProvider
      config={WALLETCONNECT_CONFIG}
      initialState={props.initialState}
    >
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          avatar={CustomAvatar}
          theme={darkTheme({
            accentColor: colors.yellow[500],
            accentColorForeground: colors.gray[900],
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          {props.children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
