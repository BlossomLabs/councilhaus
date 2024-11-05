import React from "react";
import { SITE_NAME } from "../../../../constants";
import { ConnectButton } from "./ConnectButton";

export default function Header() {
  return (
    <div className="bg-gray-900 py-4">
      <div className="container max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/logo-dark.svg" alt="CouncilHaus" className="h-9" />
          <h1 className="text-xl font-medium text-accent tracking-wider mt-1">
            {SITE_NAME}
          </h1>
        </div>
        <ConnectButton />
      </div>
    </div>
  );
}
