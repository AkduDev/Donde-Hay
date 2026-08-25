/**
 * Dónde Hay - usePublish Hook
 * Hook para publicar productos con imágenes en Supabase
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { queryKeys } from '@/lib/api-client';

// ============================================
// TYPES
// ============================================

export interface PublishProductData {
  canonicalName: string;
  brand?: string;
  model?: string;
  categoryId: string;
  description?: string;
  price: number;
  currency: 'USD' | 'CUP' | 'MLC';
  locationId: string;
  imageUris: string[];
}

export interface PublishResult {
  productId: string;
  offerId: string;
  imageUrls: string[];
}

// ============================================
// SERVICE
// ============================================

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET_NAME = 'product-images';

async function uploadImages(
  uris: string[],
  productId: string
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i]!;
    const ext = uri.split('.').pop() || 'jpg';
    const filePath = `products/${productId}/${i}.${ext}`;

    // Read file as blob
    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error('Error subiendo imagen');
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    urls.push(urlData.publicUrl);
  }

  return urls;
}

async function publishProduct(data: PublishProductData): Promise<PublishResult> {
  const userResponse = await supabase.auth.getUser();
  if (!userResponse.data.user) throw new Error('Usuario no autenticado');

  // 1. Create the product
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      canonical_name: data.canonicalName,
      brand: data.brand || null,
      model: data.model || null,
      category_id: data.categoryId,
      description: data.description || null,
      image_urls: [],
    })
    .select('id')
    .single();

  if (productError) {
    console.error('Product create error:', productError);
    throw new Error('Error creando producto');
  }

  // 2. Upload images if any
  let imageUrls: string[] = [];
  if (data.imageUris.length > 0) {
    imageUrls = await uploadImages(data.imageUris, product.id);

    // Update product with image URLs
    await supabase
      .from('products')
      .update({ image_urls: imageUrls })
      .eq('id', product.id);
  }

  // 3. Create the offer (community source)
  const { data: offer, error: offerError } = await supabase
    .from('product_offers')
    .insert({
      product_id: product.id,
      seller_id: userResponse.data.user.id,
      source_id: 'comunidad',
      price: data.price,
      currency: data.currency,
      location_id: data.locationId,
      source_url: `dondehay.app/product/${product.id}`,
      status: 'active',
    })
    .select('id')
    .single();

  if (offerError) {
    console.error('Offer create error:', offerError);
    throw new Error('Error creando oferta');
  }

  return {
    productId: product.id,
    offerId: offer.id,
    imageUrls,
  };
}

// ============================================
// HOOK
// ============================================

export function usePublish() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  return useMutation({
    mutationFn: publishProduct,
    onSuccess: (result) => {
      // Invalidate product queries
      queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.trending() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.list(),
      });
    },
    onError: (error) => {
      console.error('Publish error:', error);
    },
  });
}
