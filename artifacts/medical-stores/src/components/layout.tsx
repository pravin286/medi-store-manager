import { ReactNode } from "react";
import { Nav } from "./nav";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
      <Nav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
