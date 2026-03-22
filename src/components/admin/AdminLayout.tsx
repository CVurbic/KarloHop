import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { FileText, LogOut, Package, LayoutDashboard, CalendarDays, TrendingUp, Receipt, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAdmin } from "@/hooks/useAdmin";

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

const NavContent = ({ onNavigate, onSignOut }: { onNavigate?: () => void; onSignOut: () => void }) => (
  <>
    <div className="p-6 border-b border-gray-200">
      <img
        src="/assets/logo.webp"
        alt="Logo"
        className="h-10 w-auto"
      />
      <p className="text-xs text-gray-500 mt-2">Upravljanje sadržajem</p>
    </div>

    <nav className="flex-1 p-4 space-y-4">
      <div>
        <p className="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Poslovanje</p>
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
                    : "text-gray-600 hover:bg-gray-100"
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
        <p className="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sadržaj</p>
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
                    : "text-gray-600 hover:bg-gray-100"
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

    <div className="p-4 border-t border-gray-200">
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-gray-600"
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/hop-upravljanje");
  };

  const currentLabel = [...businessItems, ...contentItems].find(
    (item) => location.pathname.startsWith(item.to)
  )?.label || "Admin";

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
        <NavContent onSignOut={handleSignOut} />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-30">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 flex flex-col">
              <NavContent onNavigate={() => setMobileOpen(false)} onSignOut={handleSignOut} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-sm text-gray-700">{currentLabel}</span>
          <div className="w-10" />
        </div>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
