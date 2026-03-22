import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarDays, DollarSign, TrendingUp, Users, Pencil, Check } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";
import { hr } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { useAllBookings, useUpcomingBookings, useBookingsRealtime } from "@/hooks/useBookings";
import { useAllExpenses } from "@/hooks/useExpenses";
import { useSetting, useUpdateSetting } from "@/hooks/useSettings";

const BOUNCER_COLORS: Record<string, string> = {
  "Minecraft Party": "bg-blue-100 text-blue-800",
  "Dino Park": "bg-teal-100 text-teal-800",
  "Jednorog": "bg-pink-100 text-pink-800",
};

const BOUNCER_CHART_COLORS: Record<string, string> = {
  "Minecraft Party": "#3b82f6",
  "Dino Park": "#14b8a6",
  "Jednorog": "#ec4899",
};

const PIE_COLORS = ["#3b82f6", "#14b8a6", "#ec4899", "#a855f7"];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-gray-100 text-gray-800",
  };
  const labels: Record<string, string> = {
    pending: "Na čekanju",
    confirmed: "Potvrđeno",
    cancelled: "Otkazano",
    completed: "Završeno",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.pending}`}>
      {labels[status] || status}
    </span>
  );
};

const DashboardHome = () => {
  useBookingsRealtime();

  const { data: allBookings = [] } = useAllBookings();
  const { data: upcomingBookings = [] } = useUpcomingBookings(5);
  const { data: allExpenses = [] } = useAllExpenses();
  const { data: investmentValue = "0" } = useSetting("investment");
  const updateSetting = useUpdateSetting();

  const [editingInvestment, setEditingInvestment] = useState(false);
  const [investmentInput, setInvestmentInput] = useState("");

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const activeBookings = allBookings.filter((b) => b.status !== "cancelled");

    const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.price || 0), 0);

    const monthlyBookings = activeBookings.filter((b) => {
      const d = new Date(b.booking_start_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (b.price || 0), 0);

    const totalExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const investment = Number(investmentValue) || 0;
    const netProfit = totalRevenue - totalExpenses;
    const roi = investment > 0 ? ((netProfit / investment) * 100).toFixed(1) : "0";

    return {
      totalRevenue,
      totalExpenses,
      monthlyRevenue,
      reservationCount: activeBookings.length,
      monthlyCount: monthlyBookings.length,
      roi,
      netProfit,
      investment,
    };
  }, [allBookings, allExpenses, investmentValue]);

  // Chart: Reservations per month (last 6 months)
  const bookingsPerMonth = useMemo(() => {
    const now = new Date();
    const months: { label: string; count: number; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const monthStart_ = startOfMonth(d);
      const m = monthStart_.getMonth();
      const y = monthStart_.getFullYear();
      const monthBookings = allBookings.filter((b) => {
        if (b.status === "cancelled") return false;
        const bd = new Date(b.booking_start_date);
        return bd.getMonth() === m && bd.getFullYear() === y;
      });
      months.push({
        label: format(monthStart_, "LLL yy", { locale: hr }),
        count: monthBookings.length,
        revenue: monthBookings.reduce((s, b) => s + (b.price || 0), 0),
      });
    }
    return months;
  }, [allBookings]);

  // Chart: Bouncer popularity (pie chart)
  const bouncerPopularity = useMemo(() => {
    const counts: Record<string, number> = {};
    allBookings
      .filter((b) => b.status !== "cancelled" && b.selected_bounce_house)
      .forEach((b) => {
        const name = b.selected_bounce_house!;
        counts[name] = (counts[name] || 0) + 1;
      });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allBookings]);

  // Chart: Revenue trend (line chart, last 6 months)
  const revenueTrend = useMemo(() => {
    const now = new Date();
    const months: { label: string; prihod: number; troskovi: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const monthStart_ = startOfMonth(d);
      const m = monthStart_.getMonth();
      const y = monthStart_.getFullYear();
      const revenue = allBookings
        .filter((b) => {
          if (b.status === "cancelled") return false;
          const bd = new Date(b.booking_start_date);
          return bd.getMonth() === m && bd.getFullYear() === y;
        })
        .reduce((s, b) => s + (b.price || 0), 0);
      const exp = allExpenses
        .filter((e) => {
          const ed = new Date(e.expense_date);
          return ed.getMonth() === m && ed.getFullYear() === y;
        })
        .reduce((s, e) => s + Number(e.amount), 0);
      months.push({
        label: format(monthStart_, "LLL yy", { locale: hr }),
        prihod: revenue,
        troskovi: exp,
      });
    }
    return months;
  }, [allBookings, allExpenses]);

  const handleSaveInvestment = () => {
    updateSetting.mutate({ key: "investment", value: investmentInput });
    setEditingInvestment(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pregled</h1>
        <p className="text-gray-500 text-sm mt-1">Poslovni pregled i statistike</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ukupni prihod</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} €</div>
            <p className="text-xs text-gray-500 mt-1">{stats.reservationCount} rezervacija</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ukupni troškovi</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExpenses.toFixed(2)} €</div>
            <p className="text-xs text-gray-500 mt-1">Neto profit: {stats.netProfit.toFixed(2)} €</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Mjesečni prihod</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyRevenue.toFixed(2)} €</div>
            <p className="text-xs text-gray-500 mt-1">{stats.monthlyCount} rezervacija ovaj mjesec</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">ROI</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.roi}%</div>
            <div className="flex items-center gap-1 mt-1">
              {editingInvestment ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={investmentInput}
                    onChange={(e) => setInvestmentInput(e.target.value)}
                    className="h-6 w-24 text-xs"
                    placeholder="Investicija"
                  />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveInvestment}>
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <button
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  onClick={() => {
                    setInvestmentInput(investmentValue || "0");
                    setEditingInvestment(true);
                  }}
                >
                  Investicija: {Number(investmentValue).toFixed(2)} €
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bookings per month - bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Rezervacije po mjesecima</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bookingsPerMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [value, "Rezervacija"]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="count" name="Rezervacije" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bouncer popularity - pie chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Popularnost napuhanaca</CardTitle>
          </CardHeader>
          <CardContent>
            {bouncerPopularity.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">
                Nema podataka
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={bouncerPopularity}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {bouncerPopularity.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={BOUNCER_CHART_COLORS[entry.name] || PIE_COLORS[3]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, "Rezervacija"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue trend - line chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Trend prihoda i troškova</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)} €`,
                    name === "prihod" ? "Prihod" : "Troškovi",
                  ]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value: string) => (value === "prihod" ? "Prihod" : "Troškovi")}
                />
                <Line
                  type="monotone"
                  dataKey="prihod"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="troskovi"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Reservations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nadolazeće rezervacije</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-gray-500">Nema nadolazećih rezervacija.</p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {booking.name} {booking.surname}
                      </span>
                      {statusBadge(booking.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>
                        {format(new Date(booking.booking_start_date), "d. MMMM yyyy.", { locale: hr })}
                      </span>
                      {booking.phone && <span>{booking.phone}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    {booking.selected_bounce_house && (
                      <Badge
                        variant="secondary"
                        className={BOUNCER_COLORS[booking.selected_bounce_house] || ""}
                      >
                        {booking.selected_bounce_house}
                      </Badge>
                    )}
                    {booking.price != null && (
                      <p className="text-sm font-medium mt-1">{Number(booking.price).toFixed(2)} €</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
