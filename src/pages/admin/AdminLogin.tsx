import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If already logged in as admin, redirect
  if (!loading && isAdmin) {
    navigate("/hop-upravljanje/clanci", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Greška",
        description: "Neispravni podaci za prijavu.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    // Wait a moment for auth state to update, then check admin role
    setTimeout(() => {
      navigate("/hop-upravljanje/clanci");
      setSubmitting(false);
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <img
            src="/assets/logo.webp"
            alt="Logo"
            className="h-16 w-auto mx-auto mb-4"
          />
          <CardTitle>Prijava u upravljanje</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email adresa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Lozinka"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Prijava..." : "Prijavi se"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
