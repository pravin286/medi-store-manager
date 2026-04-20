import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Stethoscope, User, LogOut, Home } from "lucide-react";

export function Nav() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isOwnerArea = location.startsWith("/owner");
  const isAdminArea = location.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl">
          <Stethoscope className="h-6 w-6" />
          <span>MediDirectory</span>
        </Link>
        
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline-block">Home</span>
            </Link>
          </Button>

          {user ? (
            <>
              {user.role === "admin" ? (
                <Button variant="ghost" asChild>
                  <Link href="/admin/dashboard">Admin Dashboard</Link>
                </Button>
              ) : (
                <Button variant="ghost" asChild>
                  <Link href="/owner/dashboard">My Dashboard</Link>
                </Button>
              )}
              
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground ml-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline-block">{user.name}</span>
              </div>
              <Button variant="outline" size="icon" onClick={() => logout()} title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/owner/login">Store Owner Login</Link>
              </Button>
              <Button asChild>
                <Link href="/owner/signup">Register Store</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
