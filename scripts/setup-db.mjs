/**
 * Setup script for Hop Hop Napuhanci blog dashboard.
 *
 * Creates the blog_posts table, blog-images storage bucket, and admin user.
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
import { createInterface } from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- .env loader ----
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
    // .env not found
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
      '  4. Kopiraj \'service_role\' key (NE anon key!)\n' +
      "  5. Dodaj u .env: SUPABASE_SERVICE_ROLE_KEY=tvoj-key\n"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

async function runSetup() {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║  Hop Hop Napuhanci — Blog Dashboard Setup   ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // ---- Step 1: Check if blog_posts table exists ----
  console.log("[1/4] Provjeravam blog_posts tablicu...");
  const { error: tableCheck } = await supabase
    .from("blog_posts")
    .select("id")
    .limit(1);

  if (!tableCheck) {
    console.log("  ✓ blog_posts tablica već postoji!");
  } else {
    console.log("  ✗ blog_posts tablica ne postoji.");
    console.log("");
    console.log("  Za kreiranje tablice otvori Supabase SQL Editor:");
    console.log("  https://supabase.com/dashboard/project/egwtrsfcobwybcnbqsok/sql/new");
    console.log("");
    console.log("  Zalijepi sljedeći SQL i klikni 'Run':");
    console.log("  ─────────────────────────────────────────────");

    const sqlPath = resolve(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "20260321_add_blog_tables.sql"
    );
    const sql = readFileSync(sqlPath, "utf-8");
    console.log(sql);
    console.log("  ─────────────────────────────────────────────");

    const answer = await ask(
      "\n  Jesi li pokrenuo SQL u Supabase dashboardu? (da/ne): "
    );
    if (answer.toLowerCase() !== "da") {
      console.log("  OK — pokreni skripta ponovo kad budes spreman.\n");
      process.exit(0);
    }

    // Verify
    const { error: recheck } = await supabase
      .from("blog_posts")
      .select("id")
      .limit(1);
    if (recheck) {
      console.log(
        "  ✗ Tablica još ne postoji. Provjeri jesi li pokrenuo SQL ispravno."
      );
      process.exit(1);
    }
    console.log("  ✓ blog_posts tablica kreirana!");
  }

  // ---- Step 2: Create storage bucket ----
  console.log("\n[2/4] Kreiram blog-images storage bucket...");
  const { error: bucketError } = await supabase.storage.createBucket(
    "blog-images",
    {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
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
      console.log("  ✓ blog-images bucket već postoji!");
    } else {
      console.log("  ✗ Greška:", bucketError.message);
    }
  } else {
    console.log("  ✓ blog-images bucket kreiran! (public, max 5MB)");
  }

  // ---- Step 3: Create admin user ----
  console.log("\n[3/4] Postavljam admin korisnika...");
  const createAdmin = await ask(
    "  Želiš li kreirati admin korisnika? (da/ne): "
  );

  if (createAdmin.toLowerCase() === "da") {
    const email = await ask("  Email: ");
    const password = await ask("  Lozinka (min 6 znakova): ");

    if (!email || password.length < 6) {
      console.log("  ✗ Email ili lozinka nisu ispravni.");
    } else {
      // Create user with admin API (service role key)
      const { data: userData, error: userError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Skip email verification
        });

      if (userError) {
        if (userError.message?.includes("already been registered")) {
          console.log("  → Korisnik s tim emailom već postoji.");

          // Try to find the user and assign admin role
          const { data: users } = await supabase.auth.admin.listUsers();
          const existingUser = users?.users?.find((u) => u.email === email);
          if (existingUser) {
            const { error: roleError } = await supabase
              .from("user_roles")
              .upsert(
                { user_id: existingUser.id, role: "admin" },
                { onConflict: "user_id,role" }
              );
            if (!roleError) {
              console.log("  ✓ Admin rola dodijeljena!");
            } else {
              console.log("  ✗ Greška pri dodavanju role:", roleError.message);
            }
          }
        } else {
          console.log("  ✗ Greška:", userError.message);
        }
      } else if (userData?.user) {
        console.log(`  ✓ Korisnik kreiran (${userData.user.id})`);

        // Assign admin role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: userData.user.id, role: "admin" });

        if (roleError) {
          console.log("  ✗ Greška pri dodavanju admin role:", roleError.message);
        } else {
          console.log("  ✓ Admin rola dodijeljena!");
        }
      }
    }
  } else {
    console.log("  → Preskočeno.");
  }

  // ---- Step 4: Final verification ----
  console.log("\n[4/4] Završna provjera...");

  const { error: finalTableCheck } = await supabase
    .from("blog_posts")
    .select("id")
    .limit(1);
  const { data: buckets } = await supabase.storage.listBuckets();
  const hasBucket = buckets?.some((b) => b.name === "blog-images");

  const tableOk = !finalTableCheck;
  console.log(`  blog_posts tablica: ${tableOk ? "✓ OK" : "✗ NEDOSTAJE"}`);
  console.log(`  blog-images bucket: ${hasBucket ? "✓ OK" : "✗ NEDOSTAJE"}`);

  if (tableOk && hasBucket) {
    console.log("\n╔══════════════════════════════════════════════╗");
    console.log("║        Setup uspješno završen!               ║");
    console.log("╚══════════════════════════════════════════════╝");
    console.log("\nPristupi dashboardu na: /hop-upravljanje");
    console.log("Blog stranica je na: /savjeti\n");
  } else {
    console.log("\n⚠  Setup djelomično završen — riješi greške iznad.\n");
  }
}

runSetup().catch((err) => {
  console.error("Neočekivana greška:", err);
  process.exit(1);
});
