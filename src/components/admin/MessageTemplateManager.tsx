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
import { Plus, Trash2, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import {
  useMessageTemplates,
  useCreateMessageTemplate,
  useUpdateMessageTemplate,
  useDeleteMessageTemplate,
  type MessageTemplate,
} from "@/hooks/useMessageTemplates";

const EMPTY_FORM = { key: "", label: "", body: "", placeholders: "" };

const TemplateCard = ({ template }: { template: MessageTemplate }) => {
  const updateTemplate = useUpdateMessageTemplate();
  const deleteTemplate = useDeleteMessageTemplate();

  const [label, setLabel] = useState(template.label);
  const [body, setBody] = useState(template.body);
  const dirty = label !== template.label || body !== template.body;

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

        <div className="flex justify-end">
          <Button size="sm" disabled={!dirty || updateTemplate.isPending} onClick={handleSave}>
            Spremi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const MessageTemplateManager = () => {
  const { data: templates = [], isLoading } = useMessageTemplates();
  const createTemplate = useCreateMessageTemplate();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

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
            Sablone poruka koje šalje aplikacija. Nova sablona se pojavljuje ovdje odmah, ali dok je razvojno ne
            povežemo s trenutkom slanja, ne šalje se ništa automatski.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova sablona
        </Button>
      </div>

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
