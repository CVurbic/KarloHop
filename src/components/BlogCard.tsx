import { Link } from "react-router-dom";
import type { BlogPost } from "@/hooks/useBlogPosts";

interface BlogCardProps {
  post: BlogPost;
}

const BlogCard = ({ post }: BlogCardProps) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("hr-HR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Link to={`/savjeti/${post.slug}`} className="group block">
      <article className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-playful transition-all duration-300 h-full flex flex-col">
        {/* Cover image */}
        <div className="aspect-[16/10] overflow-hidden bg-gray-100">
          {post.cover_image ? (
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <span className="text-4xl">📝</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <time className="text-xs text-muted-foreground mb-2 block">
            {formatDate(post.published_at)}
          </time>
          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
              {post.excerpt}
            </p>
          )}
          <span className="inline-flex items-center text-sm font-medium text-primary mt-4 group-hover:gap-2 transition-all">
            Pročitaj više
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
