import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRadnik, setIsRadnik] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRoles = async (currentUser: User | null) => {
      if (!currentUser) {
        setUser(null);
        setIsAdmin(false);
        setIsRadnik(false);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id);

      const roles = (data ?? []).map((r) => r.role);
      setIsAdmin(roles.includes("admin"));
      setIsRadnik(roles.includes("radnik"));
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkRoles(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkRoles(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    // scope "local" briše sesiju odmah iz localStorage-a bez čekanja na
    // odgovor Supabase servera — ako taj poziv omane (istekao token, mreža),
    // "global" scope zna ostaviti staru sesiju u localStorage-u netaknutu,
    // pa korisnika Odjava vrati natrag u dashboard umjesto na login.
    await supabase.auth.signOut({ scope: "local" });
    setUser(null);
    setIsAdmin(false);
    setIsRadnik(false);
  };

  return { user, isAdmin, isRadnik, loading, signIn, signOut };
}
