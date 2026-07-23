-- Nova, uža rola za radnike: pristup samo /radnik ruti, nikad admin dashboardu.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'radnik';
