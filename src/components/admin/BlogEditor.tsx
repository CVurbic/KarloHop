import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Globe, FileText, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  usePostById,
  useCreatePost,
  useUpdatePost,
} from "@/hooks/useBlogPosts";
import { uploadCoverImage } from "@/lib/uploadImage";
import TiptapEditor from "./TiptapEditor";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/č/g, "c")
    .replace(/ć/g, "c")
    .replace(/đ/g, "d")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const BlogEditor = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id && id !== "novi";
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: existingPost, isLoading } = usePostById(isEditing ? id! : "");
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [content, setContent] = useState<Record<string, unknown>>({
    type: "doc",
    content: [{ type: "paragraph" }],
  });
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  // Track temp ID for new posts (for image uploads before save)
  const [tempId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setSlug(existingPost.slug);
      setSlugManual(true);
      setExcerpt(existingPost.excerpt || "");
      setCoverImage(existingPost.cover_image || "");
      setContent(existingPost.content as Record<string, unknown>);
      setSeoTitle(existingPost.seo_title || "");
      setSeoDescription(existingPost.seo_description || "");
      if (existingPost.scheduled_at) {
        setScheduledAt(existingPost.scheduled_at.slice(0, 16));
        setShowSchedule(true);
      }
    }
  }, [existingPost]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugManual) {
      setSlug(slugify(value));
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadCoverImage(file);
    if (url) {
      setCoverImage(url);
      toast({ title: "Cover slika uploadana." });
    } else {
      toast({
        title: "Greška pri uploadu slike",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (action: "draft" | "publish" | "schedule") => {
    if (!title.trim() || !slug.trim()) {
      toast({
        title: "Naslov i slug su obavezni.",
        variant: "destructive",
      });
      return;
    }

    if (action === "schedule" && !scheduledAt) {
      toast({
        title: "Odaberi datum i vrijeme za zakazanu objavu.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let status: string;
      let published_at: string | null = null;
      let scheduled_at: string | null = null;

      if (action === "publish") {
        status = "published";
        published_at = new Date().toISOString();
      } else if (action === "schedule") {
        status = "scheduled";
        scheduled_at = new Date(scheduledAt).toISOString();
      } else {
        status = "draft";
      }

      const postData = {
        title: title.trim(),
        slug: slug.trim(),
        cover_image: coverImage || null,
        content,
        excerpt: excerpt.trim() || null,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        status,
        published_at,
        scheduled_at,
      };

      const messages: Record<string, string> = {
        draft: "Skica spremljena.",
        publish: "Članak objavljen!",
        schedule: `Objava zakazana za ${new Date(scheduledAt).toLocaleString("hr-HR")}.`,
      };

      if (isEditing) {
        await updatePost.mutateAsync({ id: id!, ...postData });
        toast({ title: messages[action] });
      } else {
        await createPost.mutateAsync(postData);
        toast({ title: messages[action] });
        navigate("/hop-upravljanje/clanci");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Greška pri spremanju";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/hop-upravljanje/clanci")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Uredi članak" : "Novi članak"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Spremi skicu
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowSchedule(!showSchedule)}
            disabled={saving}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            Zakaži
          </Button>
          <Button
            onClick={() => handleSave("publish")}
            disabled={saving}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            Objavi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Naslov</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Naslov članka..."
              className="mt-1 text-lg"
            />
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="slug">URL slug</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">/savjeti/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugManual(true);
                }}
                placeholder="url-clanka"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <Label>Sadržaj</Label>
            <div className="mt-1">
              <TiptapEditor
                content={content}
                onChange={setContent}
                postId={isEditing ? id! : tempId}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cover image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cover slika</CardTitle>
            </CardHeader>
            <CardContent>
              {coverImage ? (
                <div className="space-y-2">
                  <img
                    src={coverImage}
                    alt="Cover"
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setCoverImage("")}
                  >
                    Ukloni sliku
                  </Button>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <ImagePlaceholder className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">
                      Klikni za upload slike
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Excerpt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Kratki opis</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Kratki opis za karticu na stranici savjeta..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Schedule */}
          {showSchedule && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Zakaži objavu
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setShowSchedule(false);
                    setScheduledAt("");
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="schedule-date" className="text-xs">
                    Datum i vrijeme objave
                  </Label>
                  <Input
                    id="schedule-date"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={() => handleSave("schedule")}
                  disabled={saving || !scheduledAt}
                  className="w-full gap-2"
                  variant="default"
                >
                  <Clock className="h-4 w-4" />
                  Zakaži objavu
                </Button>
                {existingPost?.status === "scheduled" && existingPost.scheduled_at && (
                  <p className="text-xs text-blue-600">
                    Trenutno zakazano: {new Date(existingPost.scheduled_at).toLocaleString("hr-HR")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">SEO postavke</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="seo-title" className="text-xs">
                  SEO naslov
                </Label>
                <Input
                  id="seo-title"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={title || "SEO naslov..."}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="seo-desc" className="text-xs">
                  Meta opis
                </Label>
                <Textarea
                  id="seo-desc"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Meta opis za Google..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save buttons (mobile) */}
          <div className="lg:hidden flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="w-full gap-2"
            >
              <Save className="h-4 w-4" />
              Spremi skicu
            </Button>
            {showSchedule && scheduledAt && (
              <Button
                variant="outline"
                onClick={() => handleSave("schedule")}
                disabled={saving}
                className="w-full gap-2"
              >
                <Clock className="h-4 w-4" />
                Zakaži objavu
              </Button>
            )}
            <Button
              onClick={() => handleSave("publish")}
              disabled={saving}
              className="w-full gap-2"
            >
              <Globe className="h-4 w-4" />
              Objavi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImagePlaceholder = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export default BlogEditor;
