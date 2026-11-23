"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = url ? new ConvexReactClient(url) : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return (
      <div className="m-auto max-w-md p-6 text-center">
        <p className="font-semibold">Convex não configurado.</p>
        <p className="mt-2 text-sm opacity-70">
          Rode <code>npx convex dev</code> para criar o arquivo .env.local com a
          variável NEXT_PUBLIC_CONVEX_URL.
        </p>
      </div>
    );
  }
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
