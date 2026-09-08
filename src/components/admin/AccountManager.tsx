import { useState } from "react";
import { format } from "date-fns";
import { hr } from "date-fns/locale";
import { Copy, KeyRound, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccountRole,
  useResetPassword,
  useDeleteAccount,
  type Account,
  type AccountRole,
} from "@/hooks/useAccounts";
import { useToast } from "@/hooks/use-toast";

const ROLE_LABEL: Record<AccountRole, string> = {
  admin: "Admin",
  radnik: "Radnik",
};

const AccountManager = () => {
  const { data: accounts, isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const updateRole = useUpdateAccountRole();
  const resetPassword = useResetPassword();
  const deleteAccount = useDeleteAccount();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccountRole>("radnik");
  const [resetTarget, setResetTarget] = useState<Account | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [resetResult, setResetResult] = useState<{ email: string; password: string } | null>(
    null
  );

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setRole("radnik");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAccount.mutateAsync({ email, password, role });
      toast({ title: "Račun kreiran." });
      resetForm();
      setDialogOpen(false);
    } catch (err) {
      toast({
        title: "Greška pri kreiranju računa",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: AccountRole) => {
    try {
      await updateRole.mutateAsync({ userId, role: newRole });
      toast({ title: "Rola promijenjena." });
    } catch (err) {
      toast({
        title: "Greška pri promjeni role",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    try {
      const { password: newPassword } = await resetPassword.mutateAsync({
        userId: resetTarget.id,
        password: resetPasswordInput || undefined,
      });
      setResetResult({ email: resetTarget.email ?? "", password: newPassword });
      setResetTarget(null);
      setResetPasswordInput("");
    } catch (err) {
      toast({
        title: "Greška pri resetiranju lozinke",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteAccount.mutateAsync(userId);
      toast({ title: "Račun obrisan." });
    } catch (err) {
      toast({
        title: "Greška pri brisanju računa",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Računi</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upravljajte računima registriranim na portal — admin i radnik pristup
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novi račun
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novi račun</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-email">Email</Label>
                <Input
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-password">Lozinka</Label>
                <Input
                  id="account-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Rola</Label>
                <Select value={role} onValueChange={(v) => setRole(v as AccountRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="radnik">Radnik — pristup ruti dostave i skupljanja</SelectItem>
                    <SelectItem value="admin">Admin — puni pristup upravljanju</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createAccount.isPending}>
                  {createAccount.isPending ? "Kreiranje..." : "Kreiraj račun"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        </div>
      ) : !accounts?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p>Još nema registriranih računa.</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Kreiran</TableHead>
                <TableHead>Zadnja prijava</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={account.role === "admin" ? "default" : "secondary"}>
                        {account.role ? ROLE_LABEL[account.role] : "Bez role"}
                      </Badge>
                      <Select
                        value={account.role ?? undefined}
                        onValueChange={(v) => handleRoleChange(account.id, v as AccountRole)}
                      >
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue placeholder="Promijeni" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="radnik">Radnik</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(account.created_at), "d. MMM yyyy.", { locale: hr })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {account.last_sign_in_at
                      ? format(new Date(account.last_sign_in_at), "d. MMM yyyy. HH:mm", { locale: hr })
                      : "Nikad"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Resetiraj lozinku"
                      onClick={() => setResetTarget(account)}
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Obriši"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Obrisati račun?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ova radnja se ne može poništiti. Račun "{account.email}" će biti
                            trajno obrisan i korisnik se više neće moći prijaviti.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Odustani</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(account.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Obriši
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={!!resetTarget}
        onOpenChange={(open) => {
          if (!open) {
            setResetTarget(null);
            setResetPasswordInput("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetiraj lozinku — {resetTarget?.email}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password">Nova lozinka</Label>
              <Input
                id="reset-password"
                type="text"
                value={resetPasswordInput}
                onChange={(e) => setResetPasswordInput(e.target.value)}
                minLength={6}
                placeholder="Ostavi prazno za nasumičnu lozinku"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={resetPassword.isPending}>
                {resetPassword.isPending ? "Postavljanje..." : "Postavi lozinku"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetResult} onOpenChange={(open) => !open && setResetResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova lozinka postavljena</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Prenesi ovu lozinku korisniku "{resetResult?.email}" izvan aplikacije (SMS, osobno...).
            Neće biti ponovno prikazana.
          </p>
          <div className="flex items-center gap-2">
            <Input readOnly value={resetResult?.password ?? ""} className="font-mono" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Kopiraj"
              onClick={() => {
                if (resetResult) {
                  navigator.clipboard.writeText(resetResult.password);
                  toast({ title: "Lozinka kopirana." });
                }
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setResetResult(null)}>Zatvori</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountManager;
