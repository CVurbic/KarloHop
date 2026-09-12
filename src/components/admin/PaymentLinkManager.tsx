import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import {
  usePaymentLinks,
  useCreatePaymentLink,
  useUpdatePaymentLink,
  useDeletePaymentLink,
  type PaymentLink,
} from "@/hooks/usePaymentLinks";

const EMPTY_FORM = { price: "", url: "", label: "" };

const LinkRow = ({ link }: { link: PaymentLink }) => {
  const updateLink = useUpdatePaymentLink();
  const deleteLink = useDeletePaymentLink();

  const [price, setPrice] = useState(String(link.price));
  const [url, setUrl] = useState(link.url);
  const [label, setLabel] = useState(link.label ?? "");
  const dirty = price !== String(link.price) || url !== link.url || label !== (link.label ?? "");

  const handleSave = async () => {
    const p = parseFloat(price);
    if (!p || !url.trim()) return;
    try {
      await updateLink.mutateAsync({ id: link.id, price: p, url: url.trim(), label: label.trim() || null });
      toast.success("Link spremljen");
    } catch {
      toast.error("Greška pri spremanju — cijena je možda već zauzeta");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Obrisati link za ${link.price} €?`)) return;
    try {
      await deleteLink.mutateAsync(link.id);
      toast.success("Link obrisan");
    } catch {
      toast.error("Greška pri brisanju");
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-28">
          <Label>Cijena (€)</Label>
          <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="min-w-0 flex-1">
          <Label>Teya link</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <div className="w-40">
          <Label>Napomena (opcionalno)</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="npr. Jednorog" />
        </div>
        <div className="flex gap-2">
          <Button size="sm" disabled={!dirty || updateLink.isPending} onClick={handleSave}>
            Spremi
          </Button>
          <Button size="icon" variant="ghost" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const PaymentLinkManager = () => {
  const { data: links = [], isLoading } = usePaymentLinks();
  const createLink = useCreatePaymentLink();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(formData.price);
    if (!price || !formData.url.trim()) return;

    try {
      await createLink.mutateAsync({ price, url: formData.url.trim(), label: formData.label.trim() || null });
      toast.success("Link dodan");
      setFormData(EMPTY_FORM);
      setShowForm(false);
    } catch {
      toast.error("Za tu cijenu link već postoji, ili greška pri spremanju");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Linkovi za naplatu</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Teya linkovi za naplatu karticom na vratima, po cijeni rezervacije. Radnik u aplikaciji klikne ikonu
            kartice uz cijenu i otvara se link koji odgovara točnom iznosu.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novi link
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        </div>
      ) : links.length === 0 ? (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <CreditCard className="h-8 w-8" />
            <p className="text-sm">Nema definiranih linkova za naplatu.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {links.map((l) => (
            <LinkRow key={l.id} link={l} />
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novi link za naplatu</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Cijena (€)</Label>
              <Input
                required
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="npr. 100"
              />
            </div>
            <div>
              <Label>Teya link</Label>
              <Input
                required
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://checkout.teya.com/pbl/..."
              />
            </div>
            <div>
              <Label>Napomena (opcionalno)</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="npr. Jednorog cjelodnevno"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Odustani
              </Button>
              <Button type="submit" disabled={createLink.isPending}>
                Dodaj link
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentLinkManager;
