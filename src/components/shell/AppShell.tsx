import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useApp } from "@/store/app";
import { NAV } from "./nav";
import { Logo } from "@/components/ll/LoopRing";
import { ClockControl, IconButtons, LangSwitch, LocalityHubSelect, RoleSwitch, ScenarioSwitch } from "./Controls";
import { AssumptionsSheet } from "./AssumptionsSheet";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useLocalitySummary, useT } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

function Hydrator() {
  const theme = useApp((s) => s.theme);
  const reduce = useApp((s) => s.reduceMotion);
  useEffect(() => {
    Promise.resolve(useApp.persist.rehydrate()).then(() => useApp.setState({ hydrated: true }));
  }, []);
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("light", theme === "light");
    el.classList.toggle("dark", theme === "dark");
    el.style.colorScheme = theme;
  }, [theme]);
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

function NavList({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const t = useT();
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV.map((n) => {
        const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
        const Icon = n.icon;
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            title={collapsed ? t(n.key) : undefined}
            className={cn(
              "group relative flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors",
              active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            {active && <motion.span layoutId="nav-active" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary-glow" />}
            <Icon className={cn("size-4 shrink-0", active && "text-primary-glow")} aria-hidden />
            {!collapsed && <span className="truncate">{t(n.key)}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarScore({ collapsed }: { collapsed: boolean }) {
  const s = useLocalitySummary();
  const t = useT();
  if (collapsed) return <div className="mx-auto grid size-10 place-items-center rounded-xl bg-primary/15 font-display text-sm font-semibold text-primary-glow">{Math.round(s.score)}</div>;
  return (
    <div className="rounded-2xl border bg-muted/30 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("kpi.score")}</p>
      <p className="font-display text-2xl font-semibold text-primary-glow tabular">{s.score.toFixed(1)}</p>
      <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        {(["waste", "solar", "rain", "reuse", "save"] as const).map((k) => (
          <span key={k} className="h-full" style={{ flex: s.scores[k], background: `var(--loop-${k})` }} />
        ))}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <TooltipProvider delayDuration={200}>
      <Hydrator />
      <ClockDriver />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="aurora animate-aurora absolute inset-[-10%]" />
        <div className="grid-bg absolute inset-0" />
      </div>

      <div className="flex min-h-dvh w-full">
        {/* Desktop rail */}
        <aside className={cn("glass-strong sticky top-0 hidden h-dvh shrink-0 flex-col border-r transition-[width] duration-300 lg:flex", collapsed ? "w-14" : "w-52")}>
          <div className={cn("flex h-12 items-center px-3", collapsed && "justify-center px-0")}>
            <Link to="/" aria-label="LoopLocal home">
              <Logo compact={collapsed} />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 no-scrollbar">
            <NavList collapsed={collapsed} />
          </div>
          <div className="space-y-2 p-3">
            <SidebarScore collapsed={collapsed} />
            <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="flex h-9 w-full items-center justify-center gap-2 rounded-xl text-xs text-muted-foreground hover:bg-accent/60 hover:text-foreground">
              {collapsed ? <PanelLeftOpen className="size-4" /> : <><PanelLeftClose className="size-4" /> Collapse</>}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass-strong sticky top-0 z-40 border-b">
            <div className="flex h-11 items-center gap-2 px-3 md:px-4">
              <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="grid size-9 place-items-center rounded-xl border lg:hidden">
                <Menu className="size-4" />
              </button>
              <Link to="/" className="lg:hidden" aria-label="LoopLocal home">
                <Logo compact />
              </Link>
              <div className="hidden md:block"><RoleSwitch /></div>
              <div className="md:hidden"><RoleSwitch compact /></div>
              <div className="ml-auto flex items-center gap-2">
                <div className="hidden sm:block"><LangSwitch /></div>
                <IconButtons />
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto border-t px-3 py-1.5 no-scrollbar md:px-4">
              <LocalityHubSelect />
              <ScenarioSwitch />
              <ClockControl className="ml-auto" />
            </div>
          </header>

          <main className="relative flex-1 px-3 py-4 md:px-5 md:py-5 xl:px-6">
            <AnimatePresence mode="wait">
              <motion.div key={path} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}>
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          <footer className="border-t px-4 py-3 text-xs text-muted-foreground md:px-6">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <p className="flex items-center gap-2"><Logo compact /> <span>LoopLocal · the neighbourhood layer for water, power, waste and drains · Hyderabad</span></p>
              <p className="font-medium text-foreground/80">The software recommends; people carry out the actions.</p>
            </div>
          </footer>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 overflow-y-auto bg-popover p-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="mb-4"><Logo /></div>
          <NavList onNavigate={() => setMobileOpen(false)} />
          <div className="mt-6 space-y-3 sm:hidden">
            <LangSwitch />
          </div>
        </SheetContent>
      </Sheet>

      <AssumptionsSheet />
      <Toaster position="top-right" closeButton />
    </TooltipProvider>
  );
}
