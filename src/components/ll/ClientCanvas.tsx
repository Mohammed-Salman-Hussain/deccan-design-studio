import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { SkeletonBlock } from "./primitives";

const HeroRingLazy = lazy(() => import("@/components/three/HeroRing"));
const HubModelLazy = lazy(() => import("@/components/three/HubModel"));

export function HeroRing3D(props: { reduce?: boolean }) {
  const fb = <div className="absolute inset-0 grid place-items-center"><div className="size-48 animate-pulse rounded-full border-8 border-primary/20" /></div>;
  return (
    <ClientOnly fallback={fb}>
      <Suspense fallback={fb}>
        <HeroRingLazy {...props} />
      </Suspense>
    </ClientOnly>
  );
}

export type HubPart = "solar" | "oht" | "sump" | "pump" | "biogas" | "stp" | "pit" | "garden" | "gateway" | "kitchen";

export function HubModel3D(props: { selected: HubPart | null; onSelect: (p: HubPart) => void; exploded: boolean; reduce?: boolean }) {
  const fb = <SkeletonBlock className="absolute inset-0" label="Loading 3D hub" />;
  return (
    <ClientOnly fallback={fb}>
      <Suspense fallback={fb}>
        <HubModelLazy {...props} />
      </Suspense>
    </ClientOnly>
  );
}
