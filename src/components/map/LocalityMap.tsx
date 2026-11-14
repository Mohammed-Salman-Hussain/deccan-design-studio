import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { SkeletonBlock } from "@/components/ll/primitives";
import type { LeafletMapProps } from "./LeafletMap";

const Lazy = lazy(() => import("./LeafletMap"));

export type { MapMarker, MapCircle } from "./LeafletMap";

export function LocalityMap(props: LeafletMapProps) {
  const fb = <SkeletonBlock className="h-full w-full" label="Loading map" />;
  return (
    <ClientOnly fallback={fb}>
      <Suspense fallback={fb}>
        <Lazy {...props} />
      </Suspense>
    </ClientOnly>
  );
}
