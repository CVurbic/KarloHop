# Google Places – postavljanje ključa za adresno polje

Adresno polje u rezervaciji (`AddressPicker`) koristi **Google Places API (New)** za
prijedloge adresa i točne koordinate. Karta ostaje besplatni OpenStreetMap; na Google
idu samo dvije stvari:

| Poziv | Google API | Kad se okida |
|---|---|---|
| Prijedlozi dok se tipka | **Places API (New)** – Autocomplete | svakih ~300 ms tipkanja |
| Koordinate odabrane adrese | **Places API (New)** – Place Details | kad korisnik klikne prijedlog |

Reverse (pin → tekst adrese) i dalje ide na besplatni Photon, ne treba Google.

---

## 1. Google Cloud projekt

1. Otvori <https://console.cloud.google.com/>.
2. Gore lijevo odaberi projekt ili **New Project** (npr. `hophop-napuhanci`).
3. **Billing** mora biti uključen na projektu:
   `Billing → Link a billing account` (treba kartica, ali vidi kvote dolje – realno €0).

## 2. Uključi API-je

`APIs & Services → Library`, pa za svaki **Enable**:

- **Places API (New)**  ← obavezno (autocomplete + details)
- *(opcionalno)* **Maps JavaScript API** – samo ako se kasnije doda Google karta

> Pazi: postoji i stari "Places API". Nama treba **Places API (New)**.

## 3. Napravi API ključ

1. `APIs & Services → Credentials → Create credentials → API key`.
2. Kopiraj ključ (`AIza...`).
3. Klikni na ključ pa ga **ograniči** (da ne procuri):

   **Application restrictions → Websites** i dodaj sve četiri (`*.` NE pokriva goli apex):
   ```
   hophop-napuhanci.com/*
   *.hophop-napuhanci.com/*
   localhost:8080/*
   localhost:*
   ```

   **API restrictions → Restrict key → Places API (New)**
   (+ Maps JavaScript API ako je uključen)

4. Save. Nova ograničenja znaju trebati par minuta da se primjene.

## 4. Ubaci ključ u projekt

`.env` (lokalno) i u hosting env varijable (Netlify/Vercel → Environment variables):

```
VITE_GOOGLE_MAPS_API_KEY="AIza...tvoj-novi-ključ"
```

Nakon promjene `.env` treba **restart dev servera** (`npm run dev`), a na hostingu
**redeploy**.

## 5. Provjera

1. `npm run dev`, otvori rezervaciju.
2. Utipkaj `Borovec 8, Dugo Selo` → mora se pojaviti Google prijedlog.
3. Klikni prijedlog → pin skoči na točnu kuću.
4. DevTools → Network: pozivi na `places.googleapis.com` vraćaju `200`.

Ako je `403` / `REQUEST_DENIED` u odgovoru:
- API nije Enable-an, ili
- ključ nema Places API (New) u API restrictions, ili
- domena nije u Website restrictions (dodaj `http://localhost:*` za lokalno).

---

## Trošak

Google Maps Platform ima mjesečnu besplatnu kvotu po API-ju. HopHop volumen su deseci
upita dnevno → duboko unutar besplatnog. Za sigurnost postavi limit:

`APIs & Services → Places API (New) → Quotas` – npr. **1.000 requests/day**.

I na billing računu:
`Billing → Budgets & alerts → Create budget` → €5/mj s email alertom.

> Kod ne koristi *session tokene* (naplata per-request umjesto per-session). Ako račun
> ikad naraste, u `src/lib/geo.ts` se doda `sessionToken` kroz `searchAddress` +
> `resolvePlace`. Za sad nepotrebno.
