import { Button } from "@repo/ui/components/ui/button";
import React from "react";

export default function Footer() {
  return (
    <div className="bg-gray-800 py-4">
      <div className="container max-w-4xl mx-auto flex justify-between items-center">
        <p className="text-md text-center text-gray-400">
          Built with ❤️ by{" "}
          <Button variant="link" className="text-gray-400 px-0 text-lg" asChild>
            <a href="https://blossom.software" target="_blank" rel="noreferrer">
              Blossom Labs
            </a>
          </Button>
        </p>
        <p className="text-md text-center text-gray-400">
          ⚡️ Powered by{" "}
          <Button variant="link" className="text-gray-400 px-0 text-lg" asChild>
            <a
              href="https://superfluid.finance"
              target="_blank"
              rel="noreferrer"
            >
              Superfluid
            </a>
          </Button>
        </p>
      </div>
    </div>
  );
}
