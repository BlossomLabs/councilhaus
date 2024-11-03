import React from "react";
import { ConnectButton } from "./ConnectButton";

export default function Header() {
  return (
    <div className="bg-gray-900 py-4">
      <div className="container max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/logo-light.svg" alt="Council Haus" className="h-10" />
          <h1 className="text-xl font-bold text-accent tracking-wider">
            Council Haus
          </h1>
        </div>
        <ConnectButton />
      </div>
    </div>
  );
}
