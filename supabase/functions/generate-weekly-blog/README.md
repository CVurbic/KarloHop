# generate-weekly-blog

Supabase Edge Function koja generira novu skicu SEO blog članka pomoću Claude API-ja
i sprema je u tablicu `blog_posts` sa statusom `draft`.

## Kako se poziva

Iz admin panela klikom na dugme **"Generiraj AI članak"** u `/hop-upravljanje/clanci`.

## Što radi

1. Provjeri da je pozivatelj autentificirani admin (`has_role`).
2. Povuče sljedeću neiskorištenu temu iz `blog_topic_queue` (sortirano po `sort_order`).
3. Pozove Anthropic API (`claude-opus-4-7`) s prompt templateom za hrvatski SEO/AIO članak.
4. Pretvori odgovor u TipTap JSON (kompatibilan s postojećim editorom).
5. Dohvati cover sliku s Pexelsa (fallback na postojeće `/public/*COVER.png`).
6. Uploada sliku u Supabase Storage bucket `blog-images`.
7. Stvori `blog_posts` zapis sa `status='draft'`, `ai_generated=true`, `topic_id=<id>`.
8. Označi temu kao `used=true`.

## Setup koraci (jednokratno)

### 1. Migracije

```bash
# Lokalni Supabase (ako koristite Supabase CLI):
supabase db push

# Ili kroz Supabase Dashboard → SQL Editor primijeniti:
# - 20260516_add_blog_topic_queue.sql
# - 20260516_add_blog_ai_metadata.sql
```

### 2. Secrets

U **Supabase Dashboard → Edge Functions → Manage secrets** dodajte:

| Varijabla | Gdje nabaviti | Obavezno |
|-----------|---------------|----------|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys | ✅ Da |
| `PEXELS_API_KEY` | https://www.pexels.com/api/ (besplatno) | ⚠️ Opcionalno (bez nje fallback na lokalne cover slike) |

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` su automatski dostupni.

### 3. Deploy edge functiona

```bash
supabase functions deploy generate-weekly-blog
```

### 4. Test

Otvorite `/hop-upravljanje/clanci`, kliknite **"Generiraj AI članak"**.
Nakon ~10-20s otvorit će se editor s generiranom skicom.
Pregledajte, uredite po potrebi, objavite.

## Troškovi

| Stavka | Trošak po članku |
|--------|------------------|
| Claude Opus 4.7 (~3-5k input + ~3k output tokena) | ~$0.30-0.60 |
| Pexels API | $0 (besplatno) |
| Supabase Storage (~500 KB/članak) | zanemarivo |

**Ukupno: ~$0.30-0.60 po članku.**

## Tema iz reda

Tablica `blog_topic_queue` ima 30 unaprijed pripremljenih tema. Status pratite u
admin panelu (broj preostalih tema je prikazan iznad popisa članaka).

Kad se približite kraju, dodajte nove teme kroz Supabase Dashboard → Table Editor →
`blog_topic_queue` ili SQL:

```sql
INSERT INTO public.blog_topic_queue (sort_order, topic_title, keywords, image_query)
VALUES (310, 'Vaša nova tema', ARRAY['ključna riječ 1', 'ključna riječ 2'], 'english search query');
```

## Promjena prompt templatea / modela

Uredite `buildPrompt()` i konstantu `ANTHROPIC_MODEL` u `index.ts`, pa redeploya:

```bash
supabase functions deploy generate-weekly-blog
```
