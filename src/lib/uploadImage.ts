import { supabase } from "@/integrations/supabase/client";

export async function uploadBlogImage(
  file: File,
  postId: string
): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}.${ext}`;
  const path = `blog/${postId}/${fileName}`;

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("blog-images").getPublicUrl(path);

  return publicUrl;
}

export async function uploadCoverImage(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const fileName = `covers/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("blog-images").getPublicUrl(fileName);

  return publicUrl;
}

export async function uploadProductImage(
  file: File,
  productId: string
): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}.${ext}`;
  const path = `products/${productId}/${fileName}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(path);

  return publicUrl;
}
