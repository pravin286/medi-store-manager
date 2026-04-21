import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Stethoscope, User, LogOut, Home } from "lucide-react";

export function Nav() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) =>
    path === "/" ? location === "/" : location.startsWith(path);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 text-white shadow-md shadow-sky-500/30">
            <Stethoscope className="h-5 w-5" />
          </span>
          <span className="text-gradient-brand">MediDirectory</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button
            variant={isActive("/") ? "secondary" : "ghost"}
            asChild
            size="sm"
            className="rounded-full"
          >
            <Link href="/" className="flex items-center gap-1.5">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline-block">Home</span>
            </Link>
          </Button>

          {user ? (
            <>
              {user.role === "admin" ? (
                <Button
                  variant={isActive("/admin") ? "secondary" : "ghost"}
                  asChild
                  size="sm"
                  className="rounded-full"
                >
                  <Link href="/admin/dashboard">Admin</Link>
                </Button>
              ) : (
                <Button
                  variant={isActive("/owner") ? "secondary" : "ghost"}
                  asChild
                  size="sm"
                  className="rounded-full"
                >
                  <Link href="/owner/dashboard">My Stores</Link>
                </Button>
              )}

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 ml-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-teal-500 grid place-items-center text-white">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-medium text-foreground">{user.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                title="Logout"
                className="rounded-full text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild size="sm" className="rounded-full">
                <Link href="/owner/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full shadow-md shadow-sky-500/20">
                <Link href="/owner/signup">Register Store</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
