// Generate a draft SEO blog post about napuhanci using Claude + Pexels.
//
// Invocation: POST /functions/v1/generate-weekly-blog
// Auth: caller must be an authenticated admin (has_role check).
// Side effects:
//   - reads the next unused row from public.blog_topic_queue
//   - calls Anthropic API to draft the article
//   - fetches a cover image from Pexels (fallback to local covers)
//   - inserts a row in public.blog_posts with status='draft', ai_generated=true
//   - marks the topic as used
//
// Required env vars (set in Supabase Dashboard → Edge Functions → Secrets):
//   ANTHROPIC_API_KEY  – Anthropic API key
//   PEXELS_API_KEY     – Pexels API key (optional; falls back to local covers)
//   SUPABASE_URL       – auto-provided
//   SUPABASE_SERVICE_ROLE_KEY – auto-provided
//   SUPABASE_ANON_KEY  – auto-provided

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ANTHROPIC_MODEL = "claude-opus-4-7";

// Fallback cover images that already live in /public.
const FALLBACK_COVERS = [
  "/DINO COVER.png",
  "/JEDNOROG COVER.png",
  "/MINE COVER.png",
];

interface TopicRow {
  id: string;
  topic_title: string;
  keywords: string[];
  image_query: string;
}

interface FaqItem {
  q: string;
  a: string;
}

type ContentBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string };

interface ArticleDraft {
  title: string;
  slug: string;
  excerpt: string;
  seo_title: string;
  seo_description: string;
  cover_alt: string;
  intro: string;
  blocks: ContentBlock[];
  faq: FaqItem[];
  cta_text: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/č/g, "c")
    .replace(/ć/g, "c")
    .replace(/đ/g, "d")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function buildPrompt(topic: TopicRow): string {
  const keywordList = topic.keywords.join(", ");
  return `Napiši kvalitetan SEO blog članak na hrvatskom jeziku za web stranicu Hop Hop Napuhanci (iznajmljivanje napuhanaca u Zagrebu i okolici).

TEMA: ${topic.topic_title}
CILJANE KLJUČNE RIJEČI: ${keywordList}

ZAHTJEVI:
- Ton: topao, prijateljski, povjerljiv (obraćaj se roditeljima s "vi")
- Duljina: 700-1000 riječi ukupno
- Lokalizacija: spomeni Zagreb i okolicu (Zaprešić, Samobor, Sveta Nedelja) gdje ima smisla
- SEO: prirodno koristi ključne riječi 3-5 puta, ne forsiraj
- AIO/AEO: kratki "answer-first" paragrafi koje LLM-ovi mogu citirati
- Struktura: uvod (1 paragraf), 4-6 H2 sekcija, po potrebi H3 podsekcija, jedan bulletList, FAQ od 4-6 pitanja, CTA na kraju
- Bez "AI fraza" tipa "U današnjem dinamičnom svijetu..."
- Bez emoji-ja

VRATI ISKLJUČIVO valjan JSON (bez markdown code blockova, bez objašnjenja) prema ovoj shemi:

{
  "title": "Naslov članka (H1) - max 70 znakova, sadrži glavnu ključnu riječ",
  "slug": "url-prijazan-naslov-bez-hr-znakova",
  "excerpt": "Kratki opis od 1-2 rečenice, do 160 znakova",
  "seo_title": "SEO title za <title> tag - max 60 znakova, sadrži 'Hop Hop Napuhanci' ili 'Zagreb'",
  "seo_description": "Meta description - 140-155 znakova, jasna korist + CTA",
  "cover_alt": "Opis cover slike za alt atribut (na hrvatskom)",
  "intro": "Uvodni paragraf (3-5 rečenica) koji direktno odgovara na pitanje iz naslova - prvih 50 riječi ključno za AIO",
  "blocks": [
    { "type": "h2", "text": "Naslov sekcije" },
    { "type": "p", "text": "Paragraf teksta..." },
    { "type": "h3", "text": "Podnaslov" },
    { "type": "p", "text": "..." },
    { "type": "ul", "items": ["Stavka 1", "Stavka 2", "Stavka 3"] },
    { "type": "quote", "text": "Istaknuti citat ili savjet" }
  ],
  "faq": [
    { "q": "Pitanje?", "a": "Kratki direktni odgovor 1-3 rečenice." }
  ],
  "cta_text": "Završni CTA paragraf koji vodi na rezervaciju napuhanca (1-2 rečenice)"
}

VAŽNO:
- JSON mora biti 100% valjan - bez trailing komi, bez komentara
- Koristi samo dozvoljene block tipove: h2, h3, p, ul, ol, quote
- FAQ je obavezan (4-6 pitanja) jer puni FAQPage schema markup
- Ne ubacuj linkove ni HTML u tekst - tekst je čisti plain text`;
}

async function callClaude(prompt: string, apiKey: string): Promise<ArticleDraft> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text || "";

  // Strip any accidental code-fence wrapping the model added despite instructions.
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    return JSON.parse(cleaned) as ArticleDraft;
  } catch (e) {
    throw new Error(`Failed to parse Claude JSON output: ${(e as Error).message}\n\nRaw: ${cleaned.slice(0, 500)}`);
  }
}

async function fetchPexelsImage(query: string, apiKey: string | undefined): Promise<{ url: string; alt: string } | null> {
  if (!apiKey) return null;

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (!res.ok) return null;

  const data = await res.json();
  const photos = data.photos || [];
  if (photos.length === 0) return null;

  // Pick a random photo from the top 15 results for variety.
  const photo = photos[Math.floor(Math.random() * photos.length)];
  return {
    url: photo.src?.large2x || photo.src?.large || photo.src?.original,
    alt: photo.alt || query,
  };
}

async function uploadImageToStorage(
  supabase: ReturnType<typeof createClient>,
  imageUrl: string,
  slug: string,
): Promise<string | null> {
  try {
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) return null;

    const blob = await imageRes.blob();
    const ext = (blob.type.split("/")[1] || "jpg").split(";")[0];
    const path = `covers/ai-${slug}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("blog-images")
      .upload(path, blob, { contentType: blob.type, cacheControl: "3600", upsert: false });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error("uploadImageToStorage failed:", e);
    return null;
  }
}

function buildTiptapDoc(article: ArticleDraft): Record<string, unknown> {
  const content: Array<Record<string, unknown>> = [];

  const para = (text: string) => ({
    type: "paragraph",
    content: [{ type: "text", text }],
  });
  const heading = (level: number, text: string) => ({
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text }],
  });

  if (article.intro?.trim()) {
    content.push(para(article.intro.trim()));
  }

  for (const block of article.blocks || []) {
    switch (block.type) {
      case "h2":
        content.push(heading(2, block.text));
        break;
      case "h3":
        content.push(heading(3, block.text));
        break;
      case "p":
        content.push(para(block.text));
        break;
      case "ul":
        content.push({
          type: "bulletList",
          content: block.items.map((item) => ({
            type: "listItem",
            content: [para(item)],
          })),
        });
        break;
      case "ol":
        content.push({
          type: "orderedList",
          content: block.items.map((item) => ({
            type: "listItem",
            content: [para(item)],
          })),
        });
        break;
      case "quote":
        content.push({
          type: "blockquote",
          content: [para(block.text)],
        });
        break;
    }
  }

  if (article.faq?.length) {
    content.push(heading(2, "Često postavljana pitanja"));
    for (const item of article.faq) {
      content.push(heading(3, item.q));
      content.push(para(item.a));
    }
  }

  if (article.cta_text?.trim()) {
    content.push(heading(2, "Rezervirajte napuhanac za vašu proslavu"));
    content.push(para(article.cta_text.trim()));
  }

  return { type: "doc", content };
}

async function ensureUniqueSlug(
  supabase: ReturnType<typeof createClient>,
  baseSlug: string,
): Promise<string> {
  let slug = baseSlug;
  let i = 2;
  while (true) {
    const { data } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
    slug = `${baseSlug}-${i++}`;
    if (i > 50) return `${baseSlug}-${Date.now()}`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY nije postavljen u Edge Function secrets." }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    // ---- Auth: verify caller is admin ----
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
    const { data: isAdmin } = await userClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // ---- Service client for writes ----
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ---- Pick next unused topic ----
    const { data: topic, error: topicErr } = await supabase
      .from("blog_topic_queue")
      .select("id, topic_title, keywords, image_query")
      .eq("used", false)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (topicErr) throw topicErr;
    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Nema više neiskorištenih tema u redu. Dodajte nove u blog_topic_queue." }),
        { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    // ---- Generate article ----
    const prompt = buildPrompt(topic as TopicRow);
    const article = await callClaude(prompt, ANTHROPIC_API_KEY);

    // ---- Cover image ----
    let coverImage: string | null = null;
    let coverAlt = article.cover_alt || (topic as TopicRow).topic_title;

    const pexels = await fetchPexelsImage((topic as TopicRow).image_query, PEXELS_API_KEY);
    if (pexels) {
      coverImage = await uploadImageToStorage(supabase, pexels.url, article.slug || slugify(article.title));
      if (!coverImage) coverImage = pexels.url; // fall back to hotlinked URL
      coverAlt = article.cover_alt || pexels.alt;
    }
    if (!coverImage) {
      coverImage = FALLBACK_COVERS[Math.floor(Math.random() * FALLBACK_COVERS.length)];
    }

    // ---- Build TipTap content ----
    const content = buildTiptapDoc(article);

    // ---- Slug uniqueness ----
    const baseSlug = slugify(article.slug || article.title);
    const slug = await ensureUniqueSlug(supabase, baseSlug);

    // ---- Insert draft ----
    const { data: newPost, error: insertErr } = await supabase
      .from("blog_posts")
      .insert({
        title: article.title,
        slug,
        cover_image: coverImage,
        content,
        excerpt: article.excerpt,
        seo_title: article.seo_title,
        seo_description: article.seo_description,
        status: "draft",
        ai_generated: true,
        topic_id: (topic as TopicRow).id,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // ---- Mark topic as used ----
    await supabase
      .from("blog_topic_queue")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id", (topic as TopicRow).id);

    return new Response(
      JSON.stringify({
        success: true,
        post: { id: newPost.id, slug: newPost.slug, title: newPost.title },
        topic: { id: (topic as TopicRow).id, topic_title: (topic as TopicRow).topic_title },
      }),
      { status: 200, headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-weekly-blog error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  }
});
