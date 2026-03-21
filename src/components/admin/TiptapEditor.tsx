import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  ImageIcon,
  LinkIcon,
  Undo,
  Redo,
  Quote,
} from "lucide-react";
import { uploadBlogImage } from "@/lib/uploadImage";

interface TiptapEditorProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  postId: string;
}

const TiptapEditor = ({ content, onChange, postId }: TiptapEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as Record<string, unknown>);
    },
  });

  // When content prop changes externally (e.g. existing post loaded from DB),
  // update the editor. Compare by checking if content has actual nodes
  // beyond the default empty paragraph.
  useEffect(() => {
    if (!editor) return;
    const contentNodes = (content as { content?: unknown[] })?.content;
    const hasRealContent =
      contentNodes &&
      contentNodes.length > 0 &&
      !(contentNodes.length === 1 && (contentNodes[0] as { type?: string })?.type === "paragraph" && !((contentNodes[0] as { content?: unknown[] })?.content));

    if (hasRealContent) {
      // Only update if editor content is different (avoid cursor jump during typing)
      const currentJSON = JSON.stringify(editor.getJSON());
      const newJSON = JSON.stringify(content);
      if (currentJSON !== newJSON) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  if (!editor) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadBlogImage(file, postId);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
        toast({ title: "Slika uploadana." });
      } else {
        toast({
          title: "Greška pri uploadu slike",
          description: "Provjeri da je bucket 'blog-images' kreiran i da imaš admin prava.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Greška pri uploadu slike",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addLink = () => {
    const url = window.prompt("URL linka:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-active={editor.isActive("bold") || undefined}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          data-active={editor.isActive("italic") || undefined}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          data-active={editor.isActive("heading", { level: 2 }) || undefined}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          data-active={editor.isActive("heading", { level: 3 }) || undefined}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-active={editor.isActive("bulletList") || undefined}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          data-active={editor.isActive("orderedList") || undefined}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          data-active={editor.isActive("blockquote") || undefined}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={addLink}
          data-active={editor.isActive("link") || undefined}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[400px] focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[400px]"
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
};

export default TiptapEditor;
