import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAllPosts, useDeletePost } from "@/hooks/useBlogPosts";
import { useToast } from "@/hooks/use-toast";

const BlogManager = () => {
  const { data: posts, isLoading } = useAllPosts();
  const deletePost = useDeletePost();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await deletePost.mutateAsync(id);
      toast({ title: "Članak obrisan." });
    } catch {
      toast({
        title: "Greška pri brisanju",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("hr-HR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Članci</h1>
          <p className="text-gray-500 text-sm mt-1">
            Upravljajte blog člancima za "Savjeti i ideje"
          </p>
        </div>
        <Link to="/hop-upravljanje/clanci/novi">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novi članak
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        </div>
      ) : !posts?.length ? (
        <div className="text-center py-12 text-gray-500">
          <FileTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Još nema članaka.</p>
          <Link to="/hop-upravljanje/clanci/novi">
            <Button variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Kreiraj prvi članak
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naslov</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        post.status === "published" ? "default" : "secondary"
                      }
                      className={
                        post.status === "scheduled"
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                          : ""
                      }
                    >
                      {post.status === "published"
                        ? "Objavljeno"
                        : post.status === "scheduled"
                        ? "Zakazano"
                        : "Skica"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {post.status === "scheduled" && post.scheduled_at
                      ? formatDate(post.scheduled_at)
                      : formatDate(post.published_at || post.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(post.status === "published" || post.status === "scheduled") && (
                        <a
                          href={`/savjeti/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="icon" title="Pregledaj">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      <Link to={`/hop-upravljanje/clanci/${post.id}`}>
                        <Button variant="ghost" size="icon" title="Uredi">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Obriši"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Obrisati članak?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Ova radnja se ne može poništiti. Članak "
                              {post.title}" će biti trajno obrisan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Odustani</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(post.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Obriši
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

// Simple file text icon for empty state
const FileTextIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
);

export default BlogManager;
