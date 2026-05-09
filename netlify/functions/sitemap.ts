import { createClient } from "@supabase/supabase-js";
import type { Handler } from "@netlify/functions";

const SUPABASE_URL = "https://egwtrsfcobwybcnbqsok.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnd3Ryc2Zjb2J3eWJjbmJxc29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTQxNjYsImV4cCI6MjA3NDQzMDE2Nn0.MArJbgzxXgc4Pq18ZlXpN5zJieso-eQtNnWw4hPCjwc";

const SITE_URL = "https://hophop-napuhanci.com";

interface BlogPost {
  slug: string;
  title: string;
  cover_image: string | null;
  published_at: string | null;
  updated_at: string | null;
}

// Static pages that are always in the sitemap
const staticPages = [
  {
    loc: "/",
    lastmod: "2026-05-06",
    changefreq: "weekly",
    priority: "1.0",
    image: {
      loc: "https://storage.googleapis.com/gpt-engineer-file-uploads/emgZnbpr3Vb55CZpsX0UjYkB0cr2/social-images/social-1758691598447-LOGO.png",
      title: "Hop Hop Napuhanci - Najam napuhanaca Zagreb",
    },
  },
  {
    loc: "/jednorog-napuhanac",
    lastmod: "2026-05-06",
    changefreq: "monthly",
    priority: "0.8",
    image: {
      loc: `${SITE_URL}/assets/unicorn-cover.png`,
      title: "Jednorog svijet napuhanac za najam Zagreb",
    },
  },
  {
    loc: "/minecraft-napuhanac",
    lastmod: "2026-05-06",
    changefreq: "monthly",
    priority: "0.8",
    image: {
      loc: `${SITE_URL}/assets/minecraft-cover.png`,
      title: "Minecraft party napuhanac za najam Zagreb",
    },
  },
  {
    loc: "/dinosaur-napuhanac",
    lastmod: "2026-05-06",
    changefreq: "monthly",
    priority: "0.8",
    image: {
      loc: `${SITE_URL}/assets/dino-cover.png`,
      title: "Dino park napuhanac za najam Zagreb",
    },
  },
  {
    loc: "/paw-patrol-napuhanac",
    lastmod: "2026-05-06",
    changefreq: "monthly",
    priority: "0.8",
    image: {
      loc: `${SITE_URL}/assets/paw-patrol.png`,
      title: "Paw Patrol napuhanac za najam Zagreb",
    },
  },
  {
    loc: "/super-mario-tobogan",
    lastmod: "2026-05-09",
    changefreq: "monthly",
    priority: "0.8",
    image: {
      loc: `${SITE_URL}/placeholder.svg`,
      title: "Super Mario tobogan napuhanac za najam Zagreb",
    },
  },
  {
    loc: "/savjeti",
    lastmod: new Date().toISOString().split("T")[0],
    changefreq: "weekly",
    priority: "0.7",
    image: null,
  },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildUrlEntry(page: {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
  image: { loc: string; title: string } | null;
}): string {
  let entry = `  <url>
    <loc>${escapeXml(SITE_URL + page.loc)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>`;

  if (page.image) {
    entry += `
    <image:image>
      <image:loc>${escapeXml(page.image.loc)}</image:loc>
      <image:title>${escapeXml(page.image.title)}</image:title>
    </image:image>`;
  }

  entry += `
  </url>`;
  return entry;
}

export const handler: Handler = async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Fetch all published blog posts
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("slug, title, cover_image, published_at, updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
    }

    // Build blog post entries
    const blogEntries = (posts as BlogPost[] | null)?.map((post) => ({
      loc: `/savjeti/${post.slug}`,
      lastmod: (post.updated_at || post.published_at || new Date().toISOString()).split("T")[0],
      changefreq: "monthly",
      priority: "0.6",
      image: post.cover_image
        ? { loc: post.cover_image, title: post.title }
        : null,
    })) || [];

    // Combine all entries
    const allEntries = [...staticPages, ...blogEntries];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allEntries.map(buildUrlEntry).join("\n")}
</urlset>`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
      body: xml,
    };
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return {
      statusCode: 500,
      body: "Error generating sitemap",
    };
  }
};
