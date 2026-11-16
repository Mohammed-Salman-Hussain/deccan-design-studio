import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

const HeroRingLazy = lazy(() => import("@/components/three/HeroRing"));

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
