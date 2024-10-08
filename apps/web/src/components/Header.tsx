import React from "react";
import { ConnectButton } from "./ConnectButton";

export default function Header() {
  return (
    <div className="bg-gray-900 py-4 mb-6">
      <div className="container max-w-4xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-accent">Council Haus</h1>
        <ConnectButton />
      </div>
    </div>
  );
}
