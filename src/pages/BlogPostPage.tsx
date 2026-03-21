import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePostBySlug } from "@/hooks/useBlogPosts";

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = usePostBySlug(slug || "");

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Image.configure({ inline: false }),
        LinkExtension.configure({ openOnClick: true }),
      ],
      content: post?.content || null,
      editable: false,
    },
    [post?.content]
  );

  useEffect(() => {
    if (post) {
      document.title =
        post.seo_title || `${post.title} | Hop Hop Napuhanci`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute(
          "content",
          post.seo_description || post.excerpt || ""
        );
      }
    }
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Članak nije pronađen</h1>
          <Link to="/savjeti" className="text-primary hover:underline">
            Povratak na savjete
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("hr-HR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <article className="pt-24 pb-12 md:pt-32">
        {/* Cover image */}
        {post.cover_image && (
          <div className="w-full max-h-[480px] overflow-hidden">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="container mx-auto px-4 max-w-3xl">
          {/* Breadcrumb */}
          <Link
            to="/savjeti"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mt-8 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Povratak na savjete
          </Link>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {post.title}
          </h1>

          {/* Date */}
          <time className="text-sm text-muted-foreground block mb-8">
            {formatDate(post.published_at)}
          </time>

          {/* Content */}
          <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-img:rounded-xl">
            {editor && <EditorContent editor={editor} />}
          </div>

          {/* CTA */}
          <div className="mt-12 p-8 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Planirate proslavu?
            </h2>
            <p className="text-muted-foreground mb-4">
              Pogledajte naše napuhance i rezervirajte termin!
            </p>
            <Link
              to="/#napuhanci"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg gradient-primary text-white font-medium hover:shadow-playful transition-all duration-300"
            >
              Pogledaj napuhance
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
