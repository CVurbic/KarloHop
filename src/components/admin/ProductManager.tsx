import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, ArrowUp, ArrowDown } from "lucide-react";
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
import {
  useAllProducts,
  useDeleteProduct,
  useReorderProducts,
} from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";

const ProductManager = () => {
  const { data: products, isLoading } = useAllProducts();
  const deleteProduct = useDeleteProduct();
  const reorderProducts = useReorderProducts();
  const { toast } = useToast();

  const handleMove = async (index: number, direction: -1 | 1) => {
    if (!products) return;
    const target = index + direction;
    if (target < 0 || target >= products.length) return;

    const a = products[index];
    const b = products[target];
    // Swap sort_order between the two adjacent rows so the displayed order matches.
    const aOrder = a.sort_order ?? index;
    const bOrder = b.sort_order ?? target;

    try {
      await reorderProducts.mutateAsync([
        { id: a.id, sort_order: bOrder },
        { id: b.id, sort_order: aOrder },
      ]);
    } catch {
      toast({ title: "Greška pri promjeni redoslijeda", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      toast({ title: "Proizvod obrisan." });
    } catch {
      toast({
        title: "Greška pri brisanju",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proizvodi</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upravljajte napuhancima — cijena, slike, opisi, popusti, redoslijed
          </p>
        </div>
        <Link to="/hop-upravljanje/proizvodi/novi">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novi proizvod
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        </div>
      ) : !products?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <BoxIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p>Još nema proizvoda.</p>
          <Link to="/hop-upravljanje/proizvodi/novi">
            <Button variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Dodaj prvi proizvod
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Redoslijed</TableHead>
                <TableHead className="w-16">Slika</TableHead>
                <TableHead>Naziv</TableHead>
                <TableHead>Cijena</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0 || reorderProducts.isPending}
                        title="Pomakni gore"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMove(index, 1)}
                        disabled={
                          index === products.length - 1 || reorderProducts.isPending
                        }
                        title="Pomakni dolje"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.cover_image ? (
                      <img
                        src={product.cover_image}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-lg" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <div>
                      {product.discount_price ? (
                        <>
                          <span className="line-through text-muted-foreground/70 text-sm">
                            {product.price}€
                          </span>{" "}
                          <span className="font-bold text-green-600">
                            {product.discount_price}€
                          </span>
                          {product.discount_label && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {product.discount_label}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="font-medium">{product.price}€</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.status === "published"
                          ? "default"
                          : product.status === "hidden"
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {product.status === "published"
                        ? "Objavljeno"
                        : product.status === "hidden"
                          ? "Skriveno"
                          : "Skica"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {product.status === "published" && (
                        <a
                          href={`/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="icon" title="Pregledaj">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      <Link to={`/hop-upravljanje/proizvodi/${product.id}`}>
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
                              Obrisati proizvod?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Ova radnja se ne može poništiti. Proizvod "
                              {product.name}" će biti trajno obrisan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Odustani</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(product.id)}
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

const BoxIcon = ({ className }: { className?: string }) => (
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
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

export default ProductManager;
