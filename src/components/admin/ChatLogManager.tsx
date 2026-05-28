import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, CalendarCheck, FlaskConical } from "lucide-react";
import { format } from "date-fns";
import { hr } from "date-fns/locale";
import { useChatLogs, type ChatLog } from "@/hooks/useChatLogs";

const fmt = (iso: string) => {
  try {
    return format(new Date(iso), "d. MMM yyyy. HH:mm", { locale: hr });
  } catch {
    return iso;
  }
};

const firstUserMessage = (log: ChatLog): string => {
  const msg = log.transcript?.find((m) => m.role === "user");
  return msg?.content?.trim() || "(bez korisničke poruke)";
};

const BookingSummary = ({ log }: { log: ChatLog }) => {
  if (!log.booking_created || !log.booking) return null;
  const b = log.booking;
  const line = [
    b.name && b.surname ? `${b.name} ${b.surname}` : null,
    b.phone ? `tel: ${b.phone}` : null,
    b.selected_bounce_house || null,
    b.booking_start_date || null,
    b.delivery_address || null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-300">
      <span className="font-semibold">Rezervacija: </span>
      {line || "napravljena"}
    </div>
  );
};

const ChatLogManager = () => {
  const { data: logs = [], isLoading } = useChatLogs();
  const [showTest, setShowTest] = useState(false);
  const [selected, setSelected] = useState<ChatLog | null>(null);

  const visible = useMemo(
    () => (showTest ? logs : logs.filter((l) => !l.is_test)),
    [logs, showTest],
  );

  const stats = useMemo(() => {
    const real = logs.filter((l) => !l.is_test);
    const todayStr = new Date().toDateString();
    return {
      total: real.length,
      bookings: real.filter((l) => l.booking_created).length,
      today: real.filter((l) => new Date(l.updated_at).toDateString() === todayStr).length,
    };
  }, [logs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mr. Hop razgovori</h1>
          <p className="text-sm text-muted-foreground">
            Povijest razgovora s chatbotom. Dnevni sažetak stiže i na e-mail.
          </p>
        </div>
        <Button
          variant={showTest ? "default" : "outline"}
          size="sm"
          onClick={() => setShowTest((v) => !v)}
          className="gap-2"
        >
          <FlaskConical className="h-4 w-4" />
          {showTest ? "Skrij testne" : "Prikaži testne"}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ukupno razgovora</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Rezervacije</p>
            <p className="text-2xl font-bold text-foreground">{stats.bookings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Danas</p>
            <p className="text-2xl font-bold text-foreground">{stats.today}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
            Još nema zabilježenih razgovora.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map((log) => (
            <button
              key={log.id}
              type="button"
              onClick={() => setSelected(log)}
              className="w-full text-left rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors p-4 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{fmt(log.updated_at)}</span>
                  {log.booking_created && (
                    <Badge className="bg-green-600 hover:bg-green-600 gap-1">
                      <CalendarCheck className="h-3 w-3" />
                      Rezervacija
                    </Badge>
                  )}
                  {log.is_test && <Badge variant="secondary">Test</Badge>}
                </div>
                <p className="text-sm text-muted-foreground truncate mt-1">{firstUserMessage(log)}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                {log.message_count} poruka
              </span>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Razgovor — {selected && fmt(selected.updated_at)}
              {selected?.is_test && <Badge variant="secondary">Test</Badge>}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-3">
              <BookingSummary log={selected} />
              <ScrollArea className="h-[55vh] pr-3">
                <div className="space-y-3">
                  {(selected.transcript ?? []).map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatLogManager;
