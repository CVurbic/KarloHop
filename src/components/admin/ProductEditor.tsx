import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Globe, FileText, Plus, X, ImageIcon, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  useProductById,
  useCreateProduct,
  useUpdateProduct,
} from "@/hooks/useProducts";
import { uploadProductImage } from "@/lib/uploadImage";

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

const ProductEditor = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id && id !== "novi";
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: existingProduct, isLoading } = useProductById(
    isEditing ? id! : ""
  );
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [coverImage, setCoverImage] = useState("");
  const [mainImage, setMainImage] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [capacity, setCapacity] = useState("");
  const [ages, setAges] = useState("");
  const [included, setIncluded] = useState<string[]>([]);
  const [newIncluded, setNewIncluded] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [discountLabel, setDiscountLabel] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoOgImage, setSeoOgImage] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const [tempId] = useState(() => crypto.randomUUID());
  const coverInputRef = useRef<HTMLInputElement>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name);
      setSlug(existingProduct.slug);
      setSlugManual(true);
      setCoverImage(existingProduct.cover_image || "");
      setMainImage(existingProduct.image || "");
      setGallery(existingProduct.gallery || []);
      setShortDesc(existingProduct.short_desc || "");
      setLongDesc(existingProduct.long_desc || "");
      setDimensions(existingProduct.dimensions || "");
      setCapacity(existingProduct.capacity || "");
      setAges(existingProduct.ages || "");
      setIncluded(existingProduct.included || []);
      setPrice(existingProduct.price);
      setDiscountPrice(existingProduct.discount_price || "");
      setDiscountLabel(existingProduct.discount_label || "");
      setSeoTitle(existingProduct.seo_title || "");
      setSeoDescription(existingProduct.seo_description || "");
      setSeoOgImage(existingProduct.seo_og_image || "");
      setSortOrder(existingProduct.sort_order || 0);
    }
  }, [existingProduct]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugManual) {
      setSlug(slugify(value));
    }
  };

  const handleImageUpload = async (
    file: File,
    setter: (url: string) => void,
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    try {
      const url = await uploadProductImage(file, isEditing ? id! : tempId);
      if (url) {
        setter(url);
        toast({ title: "Slika uploadana." });
      } else {
        toast({ title: "Greška pri uploadu slike", variant: "destructive" });
      }
    } catch {
      toast({ title: "Greška pri uploadu slike", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploadingGallery(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadProductImage(file, isEditing ? id! : tempId);
        if (url) newUrls.push(url);
      }
      if (newUrls.length) {
        setGallery((prev) => [...prev, ...newUrls]);
        toast({ title: `${newUrls.length} slika dodano u galeriju.` });
      }
    } catch {
      toast({ title: "Greška pri uploadu slika", variant: "destructive" });
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const removeGalleryImage = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const moveGalleryImage = (from: number, to: number) => {
    if (to < 0 || to >= gallery.length) return;
    setGallery((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const addIncludedItem = () => {
    const trimmed = newIncluded.trim();
    if (trimmed) {
      setIncluded((prev) => [...prev, trimmed]);
      setNewIncluded("");
    }
  };

  const removeIncludedItem = (index: number) => {
    setIncluded((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (publishNow: boolean) => {
    if (!name.trim() || !slug.trim() || !price.trim()) {
      toast({
        title: "Naziv, slug i cijena su obavezni.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const productData = {
        name: name.trim(),
        slug: slug.trim(),
        cover_image: coverImage || null,
        image: mainImage || null,
        gallery,
        short_desc: shortDesc.trim() || null,
        long_desc: longDesc.trim() || null,
        dimensions: dimensions.trim() || null,
        capacity: capacity.trim() || null,
        ages: ages.trim() || null,
        included,
        price: price.trim(),
        discount_price: discountPrice.trim() || null,
        discount_label: discountLabel.trim() || null,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        seo_og_image: seoOgImage || null,
        status: publishNow ? "published" : "draft",
        sort_order: sortOrder,
      };

      if (isEditing) {
        await updateProduct.mutateAsync({ id: id!, ...productData });
        toast({
          title: publishNow ? "Proizvod objavljen!" : "Skica spremljena.",
        });
      } else {
        await createProduct.mutateAsync(productData);
        toast({
          title: publishNow ? "Proizvod objavljen!" : "Skica spremljena.",
        });
        navigate("/hop-upravljanje/proizvodi");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Greška pri spremanju";
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
            onClick={() => navigate("/hop-upravljanje/proizvodi")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Uredi proizvod" : "Novi proizvod"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Spremi skicu
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            Objavi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Name */}
          <div>
            <Label htmlFor="name">Naziv proizvoda</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Npr. Jednorog svijet"
              className="mt-1 text-lg"
            />
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="slug">URL slug</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugManual(true);
                }}
                placeholder="jednorog-napuhanac"
              />
            </div>
          </div>

          {/* Short description */}
          <div>
            <Label htmlFor="shortDesc">Kratki opis (za karticu)</Label>
            <Input
              id="shortDesc"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Kratki opis za prikaz na kartici..."
              className="mt-1"
            />
          </div>

          {/* Long description */}
          <div>
            <Label htmlFor="longDesc">Dugi opis (za stranicu proizvoda)</Label>
            <Textarea
              id="longDesc"
              value={longDesc}
              onChange={(e) => setLongDesc(e.target.value)}
              placeholder="Detaljni opis proizvoda..."
              rows={5}
              className="mt-1"
            />
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dimensions">Dimenzije</Label>
              <Input
                id="dimensions"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="5.5 x 4.5 x 4.5m"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="capacity">Kapacitet</Label>
              <Input
                id="capacity"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Do 6 djece istovremeno"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ages">Uzrast</Label>
              <Input
                id="ages"
                value={ages}
                onChange={(e) => setAges(e.target.value)}
                placeholder="3–12 godina"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sortOrder">Redoslijed prikaza</Label>
              <Input
                id="sortOrder"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>

          {/* What's included */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Što je uključeno</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {included.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-sm bg-gray-50 px-3 py-2 rounded-md">
                    {item}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={() => removeIncludedItem(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newIncluded}
                  onChange={(e) => setNewIncluded(e.target.value)}
                  placeholder="Dodaj stavku..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addIncludedItem();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addIncludedItem}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Galerija slika</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                {gallery.map((url, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img
                      src={url}
                      alt={`Galerija ${i + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg">
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveGalleryImage(i, i - 1)}
                          disabled={i === 0}
                        >
                          <GripVertical className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeGalleryImage(i)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <label className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  {uploadingGallery ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6 text-gray-300 mb-1" />
                      <span className="text-xs text-gray-400">Dodaj</span>
                    </>
                  )}
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleGalleryUpload}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cijena</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="price" className="text-xs">
                  Cijena (€/dan)
                </Label>
                <Input
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="100"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="discountPrice" className="text-xs">
                  Akcijska cijena (€/dan) — opcionalno
                </Label>
                <Input
                  id="discountPrice"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  placeholder="Ostavi prazno ako nema popusta"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="discountLabel" className="text-xs">
                  Oznaka popusta — opcionalno
                </Label>
                <Input
                  id="discountLabel"
                  value={discountLabel}
                  onChange={(e) => setDiscountLabel(e.target.value)}
                  placeholder='Npr. "Akcija!", "Vikend popust"'
                  className="mt-1"
                />
              </div>
              {discountPrice && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <p className="text-gray-500">
                    Prikazuje se:{" "}
                    <span className="line-through">{price}€</span>{" "}
                    <span className="font-bold text-green-600">
                      {discountPrice}€
                    </span>
                    {discountLabel && (
                      <span className="ml-1 text-xs bg-green-100 px-1.5 py-0.5 rounded">
                        {discountLabel}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

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
                    {uploadingCover ? (
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-r-transparent mx-auto" />
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">
                          Klikni za upload cover slike
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        handleImageUpload(file, setCoverImage, setUploadingCover);
                      if (coverInputRef.current)
                        coverInputRef.current.value = "";
                    }}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Main image (product card) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Glavna slika proizvoda</CardTitle>
            </CardHeader>
            <CardContent>
              {mainImage ? (
                <div className="space-y-2">
                  <img
                    src={mainImage}
                    alt="Glavna slika"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setMainImage("")}
                  >
                    Ukloni sliku
                  </Button>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    {uploadingMain ? (
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-r-transparent mx-auto" />
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">
                          Klikni za upload glavne slike
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={mainInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        handleImageUpload(file, setMainImage, setUploadingMain);
                      if (mainInputRef.current)
                        mainInputRef.current.value = "";
                    }}
                  />
                </label>
              )}
            </CardContent>
          </Card>

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
                  placeholder={name || "SEO naslov..."}
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
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full gap-2"
            >
              <FileText className="h-4 w-4" />
              Spremi skicu
            </Button>
            <Button
              onClick={() => handleSave(true)}
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

export default ProductEditor;
