'use server';

import { db, eq, product, productMaterial, material, builderComponent, productBuilderComponent, categoryToProduct } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { parseIntegerInput } from '../../../lib/form-values';
import { assertAdmin } from '../../../lib/user-sync';

export async function saveProduct(formData: FormData) {
  await assertAdmin();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const basePrice = parseIntegerInput(formData.get('basePrice') as string | null);

  const salePriceStr = formData.get('salePrice') as string;
  const salePrice = salePriceStr ? parseIntegerInput(salePriceStr) : null;

  // Images: the ImageUploader sends all images (existing URLs + new base64 data URLs)
  // as a JSON array in the 'images' hidden input field.
  const imagesStr = formData.get('images') as string;
  let allImages: string[] = [];
  try {
    if (imagesStr) allImages = JSON.parse(imagesStr);
  } catch (e) {
    console.error('Failed to parse images json', e);
  }

  const status = formData.get('status') as string;
  const isAvailable = formData.get('isAvailable') === 'on';
  const isFeatured = formData.get('isFeatured') === 'on';
  const isSaleEnabled = formData.get('isSaleEnabled') === 'true';
  const stock = parseIntegerInput(formData.get('stock') as string | null) ?? 1;

  let finalSalePrice = salePrice;
  if (!isSaleEnabled) finalSalePrice = null;

  const productMaterialsStr = formData.get('productMaterials') as string;
  let productMaterialsList: { materialId: string, quantity: number }[] = [];
  try {
    if (productMaterialsStr) {
      const parsed = JSON.parse(productMaterialsStr);
      productMaterialsList = parsed.filter((b: any) => b.materialId && b.quantity > 0);
    }
  } catch (e) {
    console.error('Failed to parse product materials JSON', e);
  }

  const customFlowersBomStr = formData.get('productBuilderComponents') as string;
  let productBuilderComponentsList: { builderComponentId: string, quantity: number }[] = [];
  try {
    if (customFlowersBomStr) {
      const parsed = JSON.parse(customFlowersBomStr);
      productBuilderComponentsList = parsed.filter((b: any) => b.builderComponentId && b.quantity > 0);
    }
  } catch (e) {
    console.error('Failed to parse custom flowers BOM JSON', e);
  }

  const categoryIdsStr = formData.get('categoryIds') as string;
  let categoryIds: string[] = [];
  try {
    if (categoryIdsStr) {
      const parsed = JSON.parse(categoryIdsStr);
      categoryIds = [...new Set(parsed as string[])];
    }
  } catch (e) {
    console.error('Failed to parse category IDs JSON', e);
  }

  if (!name?.trim() || !description?.trim() || basePrice === null) {
    return { error: 'Name, description, and valid base price are required' };
  }

  if (allImages.length === 0) {
    return { error: 'At least one product image is required' };
  }

  if (productMaterialsList.length === 0 && productBuilderComponentsList.length === 0) {
    return { error: 'At least one valid material or custom flower line is required' };
  }

  try {
    let currentProductId = id;

    await db.transaction(async (tx) => {
      if (id) {
        // Fetch old product stock and BOM
        const oldProduct = await tx.query.product.findFirst({ where: eq(product.id, id) });
        const oldStock = oldProduct?.stock ?? 0;
        const oldBOM = await tx.query.productMaterial.findMany({ where: eq(productMaterial.productId, id) });
        const oldCustomBOM = await tx.query.productBuilderComponent.findMany({ where: eq(productBuilderComponent.productId, id) });

        // --- Calculate raw material usage differences ---
        const oldUsage = new Map<string, number>();
        for (const ob of oldBOM) {
          oldUsage.set(ob.materialId, oldStock * ob.quantity);
        }
        const newUsage = new Map<string, number>();
        for (const nb of productMaterialsList) {
          newUsage.set(nb.materialId, stock * nb.quantity);
        }
        const allMatIds = new Set([...oldUsage.keys(), ...newUsage.keys()]);
        for (const mId of allMatIds) {
          const oldU = oldUsage.get(mId) ?? 0;
          const newU = newUsage.get(mId) ?? 0;
          const diff = newU - oldU;

          if (diff !== 0) {
            const mat = await tx.query.material.findFirst({ where: eq(material.id, mId) });
            if (mat) {
              await tx.update(material)
                .set({ quantity: mat.quantity - diff, updatedAt: new Date() })
                .where(eq(material.id, mId));
            }
          }
        }

        // --- Calculate custom flower (builder component) usage differences ---
        const oldCustomUsage = new Map<string, number>();
        for (const ob of oldCustomBOM) {
          oldCustomUsage.set(ob.builderComponentId, oldStock * ob.quantity);
        }
        const newCustomUsage = new Map<string, number>();
        for (const nb of productBuilderComponentsList) {
          newCustomUsage.set(nb.builderComponentId, stock * nb.quantity);
        }
        const allCompIds = new Set([...oldCustomUsage.keys(), ...newCustomUsage.keys()]);
        for (const cId of allCompIds) {
          const oldU = oldCustomUsage.get(cId) ?? 0;
          const newU = newCustomUsage.get(cId) ?? 0;
          const diff = newU - oldU;

          if (diff !== 0) {
            const comp = await tx.query.builderComponent.findFirst({ where: eq(builderComponent.id, cId) });
            if (comp) {
              await tx.update(builderComponent)
                .set({ stock: comp.stock - diff, updatedAt: new Date() })
                .where(eq(builderComponent.id, cId));
            }
          }
        }

        await tx.delete(productMaterial).where(eq(productMaterial.productId, id));
        await tx.delete(productBuilderComponent).where(eq(productBuilderComponent.productId, id));
        await tx.delete(categoryToProduct).where(eq(categoryToProduct.b, id));

        await tx.update(product).set({
          name, description, basePrice, salePrice: finalSalePrice, isSaleEnabled, images: allImages, status, isAvailable, isFeatured, stock, updatedAt: new Date()
        }).where(eq(product.id, id));
      } else {
        const [newProduct] = await tx.insert(product).values({
          id: crypto.randomUUID(),
          name, description, basePrice, salePrice: finalSalePrice, isSaleEnabled, images: allImages, status, isAvailable, isFeatured, stock, updatedAt: new Date()
        }).returning({ id: product.id });
        currentProductId = newProduct.id;

        // Deduct materials for new product
        for (const pm of productMaterialsList) {
          const mat = await tx.query.material.findFirst({ where: eq(material.id, pm.materialId) });
          if (mat) {
            await tx.update(material)
              .set({ quantity: mat.quantity - (stock * pm.quantity), updatedAt: new Date() })
              .where(eq(material.id, pm.materialId));
          }
        }

        // Deduct builder components for new product
        for (const pbc of productBuilderComponentsList) {
          const comp = await tx.query.builderComponent.findFirst({ where: eq(builderComponent.id, pbc.builderComponentId) });
          if (comp) {
            await tx.update(builderComponent)
              .set({ stock: comp.stock - (stock * pbc.quantity), updatedAt: new Date() })
              .where(eq(builderComponent.id, pbc.builderComponentId));
          }
        }
      }

      if (productMaterialsList.length > 0) {
        await tx.insert(productMaterial).values(productMaterialsList.map((pm) => ({
          id: crypto.randomUUID(),
          productId: currentProductId,
          materialId: pm.materialId,
          quantity: pm.quantity
        })));
      }

      if (productBuilderComponentsList.length > 0) {
        await tx.insert(productBuilderComponent).values(productBuilderComponentsList.map((pbc) => ({
          id: crypto.randomUUID(),
          productId: currentProductId,
          builderComponentId: pbc.builderComponentId,
          quantity: pbc.quantity
        })));
      }

      if (categoryIds.length > 0) {
        await tx.insert(categoryToProduct).values(categoryIds.map(catId => ({
          a: catId,
          b: currentProductId
        })));
      }
    });

    revalidatePath('/admin/products');
    revalidatePath('/shop');
    if (currentProductId) {
      revalidatePath(`/shop/${currentProductId}`);
    }
  } catch (error) {
    console.error('Failed to save product:', error);
    return { error: 'Failed to save product. Make sure the database schema is updated.' };
  }

  return { success: true };
}

export async function deleteProduct(id: string) {
  await assertAdmin();
  try {
    await db.delete(product).where(eq(product.id, id));
    revalidatePath('/admin/products');
    revalidatePath('/shop');
    return { success: true };
  } catch {
    return { error: 'Failed to delete product' };
  }
}

export async function backfillProductMaterialDeductions() {
  await assertAdmin();
  try {
    const products = await db.query.product.findMany({
      with: { productMaterials: true }
    });

    let deductedCount = 0;
    const materialDeductions = new Map<string, number>();

    for (const prod of products) {
      if (prod.stock > 0 && prod.productMaterials) {
        for (const pm of prod.productMaterials) {
          const usage = prod.stock * pm.quantity;
          materialDeductions.set(pm.materialId, (materialDeductions.get(pm.materialId) || 0) + usage);
          deductedCount++;
        }
      }
    }

    for (const [mId, ded] of materialDeductions.entries()) {
      const mat = await db.query.material.findFirst({ where: eq(material.id, mId) });
      if (mat) {
        await db.update(material)
          .set({ quantity: mat.quantity - ded, updatedAt: new Date() })
          .where(eq(material.id, mId));
      }
    }

    revalidatePath('/admin/inventory');
    revalidatePath('/admin/materials');
    return { deducted: deductedCount };
  } catch (err) {
    console.error(err);
    return { error: 'Failed to backfill deductions' };
  }
}

export async function quickUpdateProduct(id: string, updates: { stock?: number, salePrice?: number | null, isSaleEnabled?: boolean }) {
  try {
    const payload: any = {};
    if (updates.isSaleEnabled !== undefined) {
      payload.isSaleEnabled = updates.isSaleEnabled;
      if (!updates.isSaleEnabled) {
        payload.salePrice = null;
      } else if (updates.salePrice !== undefined) {
        payload.salePrice = updates.salePrice;
      }
    } else if (updates.salePrice !== undefined) {
      payload.salePrice = updates.salePrice;
    }

    if (updates.stock !== undefined) {
      await db.transaction(async (tx) => {
        const prod = await tx.query.product.findFirst({
          where: eq(product.id, id),
          with: { productMaterials: true, productBuilderComponents: true }
        });
        
        if (prod && prod.stock !== updates.stock) {
          const oldStock = prod.stock;
          const newStock = updates.stock as number;
          
          for (const pm of prod.productMaterials) {
            const oldU = oldStock * pm.quantity;
            const newU = newStock * pm.quantity;
            const diff = newU - oldU;
            
            if (diff !== 0) {
              const mat = await tx.query.material.findFirst({ where: eq(material.id, pm.materialId) });
              if (mat) {
                await tx.update(material)
                  .set({ quantity: mat.quantity - diff, updatedAt: new Date() })
                  .where(eq(material.id, pm.materialId));
              }
            }
          }
          
          for (const pbc of prod.productBuilderComponents) {
            const oldU = oldStock * pbc.quantity;
            const newU = newStock * pbc.quantity;
            const diff = newU - oldU;
            
            if (diff !== 0) {
              const comp = await tx.query.builderComponent.findFirst({ where: eq(builderComponent.id, pbc.builderComponentId) });
              if (comp) {
                await tx.update(builderComponent)
                  .set({ stock: comp.stock - diff, updatedAt: new Date() })
                  .where(eq(builderComponent.id, pbc.builderComponentId));
              }
            }
          }
        }
        
        payload.stock = updates.stock;
        await tx.update(product).set({ ...payload, updatedAt: new Date() }).where(eq(product.id, id));
      });
    } else {
      await db.update(product).set({ ...payload, updatedAt: new Date() }).where(eq(product.id, id));
    }
    revalidatePath('/admin/products');
    revalidatePath('/shop');
    return { success: true };
  } catch {
    return { error: 'Failed to quick update product' };
  }
}
