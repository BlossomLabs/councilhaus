"use client";

import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "@repo/ui/components/ui/button";
import { useAccount } from "wagmi";

export function ConnectButton() {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  return address ? (
    <RainbowConnectButton showBalance={false} />
  ) : (
    <Button className="rounded-full" onClick={openConnectModal}>
      Connect Wallet
    </Button>
  );
}
