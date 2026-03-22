import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FileText, LogOut, Package, LayoutDashboard, CalendarDays, TrendingUp, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const AdminLayout = () => {
  const { signOut } = useAdmin();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/hop-upravljanje");
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
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
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Odjava
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
