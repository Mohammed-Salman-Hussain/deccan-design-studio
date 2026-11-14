import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { useApp } from "@/store/app";
import { NAV_MAIN, NAV_MORE } from "./nav";
import { Logo } from "@/components/ll/LoopRing";
import { ClockControl, IconButtons, LocalityHubSelect, ScenarioSwitch } from "./Controls";
import { AssumptionsSheet } from "./AssumptionsSheet";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useT } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

function Hydrator() {
  const reduce = useApp((s) => s.reduceMotion);
  useEffect(() => {
    Promise.resolve(useApp.persist.rehydrate()).then(() => useApp.setState({ hydrated: true }));
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduce);
  }, [reduce]);
  return null;
}

function ClockDriver() {
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = useApp.getState();
      if (s.playing) s.tick(3 * s.speed); // 12 sim-min per real second at 1× → a day in 2 minutes
    }, 250);
    return () => window.clearInterval(id);
  }, []);
  return null;
}

function NavItem({ to, label, icon: Icon, active, onNavigate }: { to: string; label: string; icon: typeof Menu; active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors",
        active ? "bg-card font-medium text-foreground shadow-sm" : "text-foreground/75 hover:bg-card/60 hover:text-foreground",
      )}
    >
      {active && <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary" />}
      <Icon className={cn("size-4 shrink-0", active && "text-primary-glow")} aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
  const moreActive = NAV_MORE.some((n) => isActive(n.to));
  const [moreOpen, setMoreOpen] = useState(false);
  const showMore = moreOpen || moreActive;
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV_MAIN.map((n) => (
        <NavItem key={n.to} to={n.to} label={t(n.key)} icon={n.icon} active={isActive(n.to)} onNavigate={onNavigate} />
      ))}
      <button
        type="button"
        onClick={() => setMoreOpen(!showMore)}
        aria-expanded={showMore}
        className="mt-2 flex h-8 items-center justify-between rounded-lg px-2.5 text-xs font-medium uppercase tracking-wider text-foreground/60 hover:text-foreground"
      >
        More
        <ChevronDown className={cn("size-3.5 transition-transform", showMore && "rotate-180")} aria-hidden />
      </button>
      {showMore && NAV_MORE.map((n) => (
        <NavItem key={n.to} to={n.to} label={t(n.key)} icon={n.icon} active={isActive(n.to)} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <TooltipProvider delayDuration={200}>
      <Hydrator />
      <ClockDriver />

      <div className="flex min-h-dvh w-full">
        <aside className="sticky top-0 hidden h-dvh w-52 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
          <div className="flex h-12 items-center px-4">
            <Link to="/" aria-label="LoopLocal home">
              <Logo />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 no-scrollbar">
            <NavList />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b bg-card">
            <div className="flex h-12 items-center gap-2 overflow-x-auto px-3 no-scrollbar md:px-4">
              <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="grid size-9 shrink-0 place-items-center rounded-lg border lg:hidden">
                <Menu className="size-4" />
              </button>
              <Link to="/" className="shrink-0 lg:hidden" aria-label="LoopLocal home">
                <Logo compact />
              </Link>
              <LocalityHubSelect />
              <ScenarioSwitch />
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <ClockControl />
                <IconButtons />
              </div>
            </div>
          </header>

          <main className="relative flex-1 px-3 py-4 md:px-5 md:py-5 xl:px-6">
            <AnimatePresence mode="wait">
              <motion.div key={path} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}>
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          <footer className="border-t px-4 py-3 text-center text-xs text-muted-foreground md:px-6">
            The software recommends; people carry out the actions.
          </footer>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 overflow-y-auto bg-sidebar p-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="mb-4"><Logo /></div>
          <NavList onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <AssumptionsSheet />
      <Toaster position="top-right" closeButton />
    </TooltipProvider>
  );
}
