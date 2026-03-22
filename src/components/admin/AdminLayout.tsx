import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { FileText, LogOut, Package, LayoutDashboard, CalendarDays, TrendingUp, Receipt, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAdmin } from "@/hooks/useAdmin";
import { useTheme } from "@/hooks/useTheme";

const businessItems = [
  {
    to: "/hop-upravljanje/pregled",
    label: "Pregled",
    icon: LayoutDashboard,
  },
  {
    to: "/hop-upravljanje/rezervacije",
    label: "Rezervacije",
    icon: CalendarDays,
  },
  {
    to: "/hop-upravljanje/prihodi",
    label: "Prihodi",
    icon: TrendingUp,
  },
  {
    to: "/hop-upravljanje/troskovi",
    label: "Troškovi",
    icon: Receipt,
  },
];

const contentItems = [
  {
    to: "/hop-upravljanje/proizvodi",
    label: "Proizvodi",
    icon: Package,
  },
  {
    to: "/hop-upravljanje/clanci",
    label: "Članci",
    icon: FileText,
  },
];

const NavContent = ({
  onNavigate,
  onSignOut,
  theme,
  onToggleTheme,
}: {
  onNavigate?: () => void;
  onSignOut: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) => (
  <>
    <div className="p-6 border-b border-border">
      <img
        src="/assets/logo.webp"
        alt="Logo"
        className="h-10 w-auto"
      />
      <p className="text-xs text-muted-foreground mt-2">Upravljanje sadržajem</p>
    </div>

    <nav className="flex-1 p-4 space-y-4">
      <div>
        <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Poslovanje</p>
        <div className="space-y-1">
          {businessItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div>
        <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Sadržaj</p>
        <div className="space-y-1">
          {contentItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>

    <div className="p-4 border-t border-border space-y-1">
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-muted-foreground"
        onClick={onToggleTheme}
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {theme === "dark" ? "Svijetli mod" : "Tamni mod"}
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-muted-foreground"
        onClick={onSignOut}
      >
        <LogOut className="h-4 w-4" />
        Odjava
      </Button>
    </div>
  </>
);

const AdminLayout = () => {
  const { signOut } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate("/hop-upravljanje");
  };

  const currentLabel = [...businessItems, ...contentItems].find(
    (item) => location.pathname.startsWith(item.to)
  )?.label || "Admin";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col">
        <NavContent onSignOut={handleSignOut} theme={theme} onToggleTheme={toggleTheme} />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-30">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 flex flex-col">
              <NavContent onNavigate={() => setMobileOpen(false)} onSignOut={handleSignOut} theme={theme} onToggleTheme={toggleTheme} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-sm text-foreground">{currentLabel}</span>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
