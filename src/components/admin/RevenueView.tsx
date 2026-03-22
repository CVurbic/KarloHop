import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAllBookings, useBookingsRealtime } from "@/hooks/useBookings";
import { useAllExpenses } from "@/hooks/useExpenses";
import { useSetting } from "@/hooks/useSettings";

const BOUNCERS = [
  { name: "Minecraft Party", color: "#3b82f6", key: "minecraft" },
  { name: "Dino Park", color: "#14b8a6", key: "dino" },
  { name: "Jednorog", color: "#ec4899", key: "jednorog" },
];

const MONTH_NAMES = [
  "Sij", "Velj", "Ožu", "Tra", "Svi", "Lip",
  "Srp", "Kol", "Ruj", "Lis", "Stu", "Pro",
];

const RevenueView = () => {
  useBookingsRealtime();

  const { data: bookings = [] } = useAllBookings();
  const { data: expenses = [] } = useAllExpenses();
  const { data: investmentValue = "0" } = useSetting("investment");

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const activeBookings = useMemo(
    () => bookings.filter((b) => b.status !== "cancelled"),
    [bookings]
  );

  // Revenue by bouncer
  const revenueByBouncer = useMemo(() => {
    const map: Record<string, number> = {};
    activeBookings.forEach((b) => {
      const name = b.selected_bounce_house || "Ostalo";
      map[name] = (map[name] || 0) + (b.price || 0);
    });
    return map;
  }, [activeBookings]);

  const totalRevenue = Object.values(revenueByBouncer).reduce((s, v) => s + v, 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const investment = Number(investmentValue) || 0;
  const netProfit = totalRevenue - totalExpenses;
  const roi = investment > 0 ? ((netProfit / investment) * 100).toFixed(1) : "0";

  // Monthly chart data
  const monthlyData = useMemo(() => {
    return MONTH_NAMES.map((monthName, monthIdx) => {
      const row: Record<string, string | number> = { month: monthName };
      BOUNCERS.forEach((bouncer) => {
        const sum = activeBookings
          .filter((b) => {
            const d = new Date(b.booking_start_date);
            return (
              d.getFullYear() === selectedYear &&
              d.getMonth() === monthIdx &&
              b.selected_bounce_house === bouncer.name
            );
          })
          .reduce((s, b) => s + (b.price || 0), 0);
        row[bouncer.key] = sum;
      });
      return row;
    });
  }, [activeBookings, selectedYear]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Prihodi</h1>
        <p className="text-muted-foreground text-sm mt-1">Analiza prihoda po napuhancu i mjesecu</p>
      </div>

      {/* ROI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Investicija</p>
            <p className="text-2xl font-bold">{investment.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ukupni prihod</p>
            <p className="text-2xl font-bold text-green-600">{totalRevenue.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Neto profit</p>
            <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {netProfit.toFixed(2)} €
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">ROI</p>
            <p className="text-2xl font-bold text-purple-600">{roi}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by bouncer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prihod po napuhancu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {BOUNCERS.map((bouncer) => {
            const revenue = revenueByBouncer[bouncer.name] || 0;
            const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

            return (
              <div key={bouncer.name}>
                <div className="flex justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: bouncer.color }} />
                    <span className="font-medium">{bouncer.name}</span>
                  </div>
                  <span className="text-muted-foreground">{revenue.toFixed(2)} € ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: bouncer.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
          {revenueByBouncer["Ostalo"] != null && revenueByBouncer["Ostalo"] > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Ostalo</span>
                <span className="text-muted-foreground">{revenueByBouncer["Ostalo"].toFixed(2)} €</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Mjesečni trendovi</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSelectedYear((y) => y - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">{selectedYear}</span>
            <Button variant="ghost" size="icon" onClick={() => setSelectedYear((y) => y + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(2)} €`}
                contentStyle={{ fontSize: 12, backgroundColor: "var(--chart-tooltip-bg, #fff)", border: "1px solid var(--chart-tooltip-border, #e5e7eb)", color: "var(--chart-tooltip-text, #111)" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {BOUNCERS.map((bouncer) => (
                <Bar
                  key={bouncer.key}
                  dataKey={bouncer.key}
                  name={bouncer.name}
                  fill={bouncer.color}
                  stackId="revenue"
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueView;
