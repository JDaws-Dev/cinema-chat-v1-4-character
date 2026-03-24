"use client";

import { ConvexProvider as BaseConvexProvider } from "convex/react";
import { convex } from "@/lib/convex";
import { ReactNode } from "react";

export function ConvexProvider({ children }: { children: ReactNode }) {
  return <BaseConvexProvider client={convex}>{children}</BaseConvexProvider>;
}
