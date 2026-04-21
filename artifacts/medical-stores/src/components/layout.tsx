import { ReactNode } from "react";
import { Nav } from "./nav";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-hero -z-10" />
      <div className="pointer-events-none absolute inset-0 bg-grid-slate opacity-40 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />
      <Nav />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t mt-16 bg-white/60 backdrop-blur">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} MediDirectory — Trusted pharmacies near you.</p>
          <p className="text-xs">Built with care for healthier communities.</p>
        </div>
      </footer>
    </div>
  );
}
