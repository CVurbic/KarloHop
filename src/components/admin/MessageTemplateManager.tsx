import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, MessageSquareText, MapPin, AlertTriangle, Eye, Copy } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { hr } from "date-fns/locale";
import {
  useMessageTemplates,
  useCreateMessageTemplate,
  useUpdateMessageTemplate,
  useDeleteMessageTemplate,
  fillTemplate,
  type MessageTemplate,
} from "@/hooks/useMessageTemplates";
import { useMessageLog, useLogMessage } from "@/hooks/useMessageLog";
import { placementFor, missingTemplateKeys } from "@/lib/messageTemplateRegistry";

const EMPTY_FORM = { key: "", label: "", body: "", placeholders: "" };

const STATUS_LABEL: Record<string, string> = {
  opened: "otvoreno na terenu",
  test: "test",
  sent: "poslano",
  failed: "greška",
};

const PreviewDialog = ({
  template,
  open,
  onOpenChange,
}: {
  template: MessageTemplate;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const logMessage = useLogMessage();
  const placement = placementFor(template.key);
  const sampleVars = placement?.sampleVars ?? {};
  const filled = fillTemplate(template.body, sampleVars);
  const unfilled = [...filled.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  const channel = placement?.channel ?? "sms";
  const smsHref = `sms:?body=${encodeURIComponent(filled)}`;

  const handleOpenSms = () => {
    logMessage.mutate({
      template_key: template.key,
      channel: "sms",
      body: filled,
      status: "test",
      context: { source: "dashboard-preview" },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pregled: {template.label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Tekst s primjerima varijabli{Object.keys(sampleVars).length ? "" : " (registar nema primjere za ovaj predložak)"}:
          </p>
          <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">{filled}</div>
          {unfilled.length > 0 && (
            <p className="text-xs text-amber-600">
              Nepopunjene varijable: {unfilled.map((v) => `{${v}}`).join(", ")}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard?.writeText(filled);
                toast.success("Tekst kopiran");
              }}
            >
              <Copy className="h-4 w-4 mr-2" /> Kopiraj tekst
            </Button>
            {channel === "sms" && (
              <Button size="sm" asChild onClick={handleOpenSms}>
                <a href={smsHref}>Otvori u SMS aplikaciji</a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TemplateCard = ({ template }: { template: MessageTemplate }) => {
  const updateTemplate = useUpdateMessageTemplate();
  const deleteTemplate = useDeleteMessageTemplate();
  const { data: logs = [] } = useMessageLog(template.key, 50);

  const [label, setLabel] = useState(template.label);
  const [body, setBody] = useState(template.body);
  const [previewOpen, setPreviewOpen] = useState(false);
  const dirty = label !== template.label || body !== template.body;

  const placement = placementFor(template.key);
  const last = logs[0];
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const last30 = logs.filter((l) => new Date(l.created_at).getTime() > cutoff).length;

  const handleSave = async () => {
    try {
      await updateTemplate.mutateAsync({ id: template.id, label, body });
      toast.success("Sablona spremljena");
    } catch {
      toast.error("Greška pri spremanju sablone");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Obrisati sablonu "${template.label}"? Ako se koristi u kodu, ta automatska poruka prestaje raditi dok se ne zamijeni.`)) return;
    try {
      await deleteTemplate.mutateAsync(template.id);
      toast.success("Sablona obrisana");
    } catch {
      toast.error("Greška pri brisanju");
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="font-medium" />
            <code className="text-xs text-muted-foreground">{template.key}</code>
          </div>
          <Button size="icon" variant="ghost" onClick={handleDelete} className="shrink-0">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>

        {placement ? (
          <div className="rounded-md bg-muted/50 p-2.5 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-medium">
              <MapPin className="h-3.5 w-3.5 shrink-0" /> {placement.where}
            </div>
            <p className="text-muted-foreground">{placement.trigger}</p>
            <code className="text-[11px] text-muted-foreground">{placement.file}</code>
          </div>
        ) : (
          <div className="flex items-start gap-1.5 rounded-md bg-amber-50 p-2.5 text-xs text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>Nije povezano u kodu — uređivanje ovog teksta trenutno ništa ne mijenja.</span>
          </div>
        )}

        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-24 resize-none text-sm"
        />

        {template.placeholders.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Dostupne varijable:</span>
            {template.placeholders.map((p) => (
              <Badge key={p} variant="secondary" className="font-mono text-xs">
                {`{${p}}`}
              </Badge>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {last ? (
            <>
              Zadnje korišteno {formatDistanceToNow(new Date(last.created_at), { locale: hr, addSuffix: true })}
              {" "}({STATUS_LABEL[last.status] ?? last.status}) · {last30} u zadnjih 30 dana
            </>
          ) : (
            "Još nije zabilježeno korištenje."
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-2" /> Pregledaj
          </Button>
          <Button size="sm" disabled={!dirty || updateTemplate.isPending} onClick={handleSave}>
            Spremi
          </Button>
        </div>
      </CardContent>

      <PreviewDialog template={template} open={previewOpen} onOpenChange={setPreviewOpen} />
    </Card>
  );
};

const MessageTemplateManager = () => {
  const { data: templates = [], isLoading } = useMessageTemplates();
  const createTemplate = useCreateMessageTemplate();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const missing = missingTemplateKeys(templates.map((t) => t.key));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = formData.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!key || !formData.label.trim() || !formData.body.trim()) return;

    try {
      await createTemplate.mutateAsync({
        key,
        label: formData.label.trim(),
        body: formData.body.trim(),
        placeholders: formData.placeholders
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
      });
      toast.success("Sablona dodana");
      setFormData(EMPTY_FORM);
      setShowForm(false);
    } catch {
      toast.error("Ključ sablone već postoji ili je greška pri spremanju");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automatske poruke</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sablone poruka koje šalje aplikacija. Uz svaku piše gdje je u aplikaciji zakvačena i kad je zadnji put
            korištena. Nova sablona bez povezanog mjesta u kodu ne šalje se automatski.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova sablona
        </Button>
      </div>

      {missing.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-6 flex items-start gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Kod očekuje sablone koje ne postoje: <strong>{missing.join(", ")}</strong>. Te automatske poruke ne rade
              dok se sablone ne dodaju.
            </span>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <MessageSquareText className="h-8 w-8" />
            <p className="text-sm">Nema definiranih sablona poruka.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova sablona poruke</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Naziv (prikazuje se u dashboardu)</Label>
              <Input
                required
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="npr. SMS - podsjetnik dan prije"
              />
            </div>
            <div>
              <Label>Ključ (koristi se u kodu, jedinstven)</Label>
              <Input
                required
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="npr. reminder_sms"
              />
            </div>
            <div>
              <Label>Tekst poruke</Label>
              <Textarea
                required
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="min-h-24 resize-none"
                placeholder="Pozdrav, sutra u {vrijeme} dolazimo s Vašim {stavke}..."
              />
            </div>
            <div>
              <Label>Varijable (odvojene zarezom, opcionalno)</Label>
              <Input
                value={formData.placeholders}
                onChange={(e) => setFormData({ ...formData, placeholders: e.target.value })}
                placeholder="vrijeme, stavke"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Odustani
              </Button>
              <Button type="submit" disabled={createTemplate.isPending}>
                Dodaj sablonu
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageTemplateManager;
