/**
 * Setup script for Hop Hop Napuhanci blog dashboard.
 *
 * Creates the blog_posts table and blog-images storage bucket in Supabase.
 *
 * Usage:
 *   1. Add SUPABASE_SERVICE_ROLE_KEY to your .env file
 *      (find it in Supabase dashboard -> Settings -> API -> service_role)
 *   2. Run: npm run setup:db
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (no extra dependency needed)
function loadEnv() {
  try {
    const envPath = resolve(__dirname, "..", ".env");
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      // Remove surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env file not found — rely on existing env vars
  }
}

loadEnv();

const supabaseUrl =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error(
    "VITE_SUPABASE_URL ili SUPABASE_URL nije postavljen u .env datoteci."
  );
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error(
    "\nSUPABASE_SERVICE_ROLE_KEY nije postavljen u .env datoteci.\n\n" +
      "Kako ga pronaći:\n" +
      "  1. Idi na https://supabase.com/dashboard\n" +
      "  2. Otvori svoj projekt\n" +
      "  3. Settings -> API -> Project API keys\n" +
      "  4. Kopiraj 'service_role' key (NE anon key!)\n" +
      "  5. Dodaj u .env: SUPABASE_SERVICE_ROLE_KEY=tvoj-key\n"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runMigration() {
  console.log("\n=== Hop Hop Napuhanci — Setup baze ===\n");

  // Step 1: Run SQL migration
  console.log("[1/3] Kreiram blog_posts tablicu...");
  const sqlPath = resolve(
    __dirname,
    "..",
    "supabase",
    "migrations",
    "20260321_add_blog_tables.sql"
  );
  const sql = readFileSync(sqlPath, "utf-8");

  const { error: sqlError } = await supabase.rpc("", undefined).then(
    () => ({ error: null }),
    () => ({ error: null })
  );

  // Use the Supabase REST API to execute raw SQL via the pg_query endpoint
  // The service role key gives us access to execute SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
  }).catch(() => null);

  // Alternative approach: use the SQL endpoint directly
  const sqlResponse = await fetch(`${supabaseUrl}/pg`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  }).catch(() => null);

  // If direct SQL doesn't work, try the management API
  if (!sqlResponse || !sqlResponse.ok) {
    // Try using supabase-js to check if table already exists
    const { error: checkError } = await supabase
      .from("blog_posts")
      .select("id")
      .limit(1);

    if (!checkError) {
      console.log("  -> blog_posts tablica vec postoji! Preskačem...");
    } else if (
      checkError.message?.includes("does not exist") ||
      checkError.code === "42P01"
    ) {
      // Table doesn't exist — need to create it via Supabase Management API
      const projectRef = supabaseUrl.match(
        /https:\/\/([^.]+)\.supabase\.co/
      )?.[1];
      if (projectRef) {
        console.log(
          "  -> Pokušavam kreirati tablicu preko Management API..."
        );
        const mgmtResponse = await fetch(
          `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
          {
            method: "POST",
            headers: {
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: sql }),
          }
        ).catch(() => null);

        if (mgmtResponse && mgmtResponse.ok) {
          console.log("  -> blog_posts tablica kreirana!");
        } else {
          console.log(
            "\n  -> Automatsko kreiranje tablice nije uspjelo."
          );
          console.log("     Molim te koristi jednu od ovih opcija:\n");
          console.log("     Opcija A: Supabase CLI");
          console.log(
            `     npx supabase link --project-ref ${projectRef}`
          );
          console.log("     npx supabase db push\n");
          console.log("     Opcija B: Supabase SQL Editor");
          console.log(
            "     1. Otvori supabase.com/dashboard -> SQL Editor"
          );
          console.log(`     2. Kopiraj sadržaj iz: ${sqlPath}`);
          console.log("     3. Klikni Run\n");
        }
      }
    } else {
      console.log("  -> Greška:", checkError.message);
    }
  } else {
    console.log("  -> blog_posts tablica kreirana!");
  }

  // Step 2: Create storage bucket
  console.log("[2/3] Kreiram blog-images storage bucket...");
  const { error: bucketError } = await supabase.storage.createBucket(
    "blog-images",
    {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB max
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ],
    }
  );

  if (bucketError) {
    if (bucketError.message?.includes("already exists")) {
      console.log("  -> blog-images bucket vec postoji! Preskačem...");
    } else {
      console.log("  -> Greška pri kreiranju bucketa:", bucketError.message);
    }
  } else {
    console.log("  -> blog-images bucket kreiran!");
  }

  // Step 3: Verify
  console.log("[3/3] Verificiram setup...");
  const { data: buckets } = await supabase.storage.listBuckets();
  const hasBucket = buckets?.some((b) => b.name === "blog-images");

  const { error: tableCheck } = await supabase
    .from("blog_posts")
    .select("id")
    .limit(1);

  console.log(
    `  -> blog_posts tablica: ${!tableCheck ? "OK" : "NEDOSTAJE"}`
  );
  console.log(`  -> blog-images bucket: ${hasBucket ? "OK" : "NEDOSTAJE"}`);

  if (!tableCheck && hasBucket) {
    console.log("\n=== Setup uspješno završen! ===");
    console.log(
      "\nSljedeći korak: kreiraj admin korisnika u Supabase dashboardu:"
    );
    console.log("  1. Authentication -> Users -> Add user");
    console.log(
      "  2. SQL Editor -> pokreni: INSERT INTO user_roles (user_id, role) VALUES ('tvoj-user-uuid', 'admin');"
    );
    console.log("\nNakon toga pristupi dashboardu na: /hop-upravljanje\n");
  } else {
    console.log(
      "\n=== Setup djelomično završen — provjeri gore navedene greške ===\n"
    );
  }
}

runMigration().catch((err) => {
  console.error("Neočekivana greška:", err);
  process.exit(1);
});
